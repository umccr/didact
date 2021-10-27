/**
 * The dataset service provides business layer functionality around
 * datasets.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { AnyEntity, Paged, Table } from 'dynamodb-onetable';
import { getTable } from '../db/didact-table-utils';
import { ApplicationEventDbType, ApplicationReleaseSubjectDbType, getTypes } from '../db/didact-table-types';
import { ApplicationApiEditableModel, ApplicationApiModel } from '../../../../shared-src/api-models/application';
import { PERSON_NAMES } from '../../testing/setup-test-data';
import _ from 'lodash';

export type ReleaseArtifactModel = {
  sampleId: string;
  path: string;
  chromosomes?: string[];
};

class ApplicationService {
  private readonly table: Table;

  constructor() {
    const client = new Dynamo({
      client: new DynamoDBClient({}),
    });

    this.table = getTable(client);
  }

  public async createNew(applicantId: string, principalInvestigatorId, datasetId: string, projectTitle: string): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const newApp = await ApplicationDbModel.create({
      applicantId: applicantId,
      principalInvestigatorId: principalInvestigatorId,
      datasetId: datasetId,
      projectTitle: projectTitle,
      researchUseStatement: '(replace with research use statement)',
      state: 'started',
    });

    await ApplicationEventDbModel.create({
      as: 'applicant',
      byId: applicantId,
      applicationId: newApp.id,
      action: 'create',
      detail: '',
    });

    return this.asApplication(newApp.id, applicantId);
  }

  public async update(applicationId: string, editorUserId: string, updatedData: ApplicationApiEditableModel): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const existingApp = await ApplicationDbModel.get({ id: applicationId });

    if (!existingApp) throw new Error(`Application ${applicationId} does not exist`);

    // we need to convert our incoming snomed/hgnc to actual sets
    // converting everything to sets helps out with the logic
    const updateSnomedSet = new Set(_.isArray(updatedData.snomed) ? updatedData.snomed : []);
    const updateHgncSet = new Set(_.isArray(updatedData.hgnc) ? updatedData.hgnc : []);
    const existingSnomedSet = existingApp.snomed ? existingApp.snomed : new Set();
    const existingHgncSet = existingApp.hgnc ? existingApp.hgnc : new Set();

    console.log(
      `Sets existing ${Array.from(existingSnomedSet.values())} ${Array.from(existingHgncSet.values())} update ${Array.from(
        updateSnomedSet.values(),
      )} ${Array.from(updateHgncSet.values())}`,
    );

    // we only want to actually do an update if there is genuine change
    const changes: string[] = [];

    // note the ecma Set is so woefully underpowered that it doesn't even support equality?? anyhow - use lodash
    if (existingApp.researchUseStatement != updatedData.researchUseStatement) changes.push('rus');
    if (!_.isEqual(updateSnomedSet, existingSnomedSet)) changes.push('snomed');
    if (!_.isEqual(updateHgncSet, existingHgncSet)) changes.push('hgnc');

    // only execute if we found a change
    if (changes.length > 0) {
      await ApplicationDbModel.update({
        id: applicationId,
        researchUseStatement: _.isString(updatedData.researchUseStatement) ? updatedData.researchUseStatement : undefined,
        // we have to take into account here that onetable wants undefined for 'empty' data.. not empty data
        snomed: updateSnomedSet.size > 0 ? (updateSnomedSet as any) : undefined,
        hgnc: updateHgncSet.size > 0 ? (updateHgncSet as any) : undefined,
      });

      await ApplicationEventDbModel.create({
        as: 'applicant',
        byId: editorUserId,
        applicationId: applicationId,
        action: 'edit',
        detail: `updated fields ${changes.join(', ')}`,
      });
    }

    return this.asApplication(applicationId, editorUserId);
  }

  /**
   * List all the applications involving the given user identity - where they are involved as a researcher.
   * @param userId
   */
  public async listByUserAsResearcher(userId: string): Promise<ApplicationApiModel[]> {
    const applicationIds = await this.findInvolvedAsApplicant(userId);

    const results = [];

    for (const a of applicationIds) results.push(await this.asApplication(a, userId));

    return results;
  }

  /**
   * List all the application involving the given use identity - where they are involved as a committee member.
   * @param userId
   */
  public async listByUserAsCommittee(userId: string): Promise<ApplicationApiModel[]> {
    const applicationIds = await this.findInvolvedAsCommittee(userId);

    console.log(applicationIds);

    const results = [];

    for (const a of applicationIds) results.push(await this.asApplication(a, userId));

    return results;
  }

  /**
   * For the given application id return the complete API model consisting of
   * nested events etc. If application is not found returns null.
   *
   * @param applicationId
   * @param viewerUserId
   */
  public async asApplication(applicationId: string, viewerUserId: string): Promise<ApplicationApiModel | null> {
    const { ApplicationDbModel, ApplicationEventDbModel, DatasetDbModel, CommitteeMemberDbModel } = getTypes(this.table);

    const theApp = await ApplicationDbModel.get({ id: applicationId });

    if (!theApp) return null;

    const theDataset = await DatasetDbModel.get({ id: theApp.datasetId });

    if (!theDataset) return null;

    const theAppResult: ApplicationApiModel = {
      id: theApp.id,
      state: theApp.state,
      datasetId: theApp.datasetId,
      projectTitle: theApp.projectTitle,
      researchUseStatement: theApp.researchUseStatement,
      applicantId: theApp.applicantId,
      applicantDisplayName: PERSON_NAMES[theApp.applicantId] || theApp.applicantId,
      principalInvestigatorId: theApp.principalInvestigatorId,
      principalInvestigatorDisplayName: PERSON_NAMES[theApp.principalInvestigatorId] || theApp.principalInvestigatorId,
      snomed: Array.from((theApp.snomed as any) || []),
      hgnc: Array.from((theApp.hgnc as any) || []),
      // note: these data states are invalid in the API - they *will* be replaced with
      // a proper lastUpdated data and at least one event - or we will throw an exception later
      lastUpdated: '',
      events: [],
      // these will be computed and added too later
      allowedStateActions: [],
      allowedViews: [],
    };

    const eventsSorted = [];
    {
      let aeNext: any = null;
      let aeItemPage: Paged<ApplicationEventDbType>;
      do {
        aeItemPage = await ApplicationEventDbModel.find({ applicationId: applicationId });

        for (const item of aeItemPage) {
          eventsSorted.push({
            when: item.when.toJSON(),
            byId: item.byId,
            byName: PERSON_NAMES[item.byId],
            as: item.as,
            action: item.action,
            detail: item.detail,
          });
        }

        aeNext = aeItemPage.next;
      } while (aeNext);
    }

    if (eventsSorted.length < 1)
      throw new Error(`Application ${applicationId} was found in the db with no associated events (not even a creation event)`);

    eventsSorted.sort((a, b) => a.when.localeCompare(b.when));

    if (theAppResult.state === 'approved') {
      const dbSubjects = await this.getApplicationReleaseSubjects(applicationId);
      theAppResult.release = {
        readsEnabled: theApp.readsEnabled,
        variantsEnabled: theApp.variantsEnabled,
        phenotypesEnabled: theApp.phenotypesEnabled,
        panelappId: theApp.panelappId.toString(),
        panelappVersion: theApp.panelappVersion,
        panelappDisplayName: 'TBD',
        htsgetEndpoint: theApp.htsgetEndpoint,
        fhirEndpoint: theApp.fhirEndpoint,
        subjects: [],
      };
      theAppResult.release.subjects = dbSubjects.map(rs => {
        return {
          subjectId: rs.subjectId,
          sampleIds: rs.sampleIds,
        };
      });
    }

    theAppResult.lastUpdated = eventsSorted[0].when;
    theAppResult.events = eventsSorted;

    // TODO: all the logic for state transition permissions
    const isEditor = theAppResult.principalInvestigatorId == viewerUserId || theAppResult.applicantId == viewerUserId;

    let isCommittee = false;

    for (const item of await CommitteeMemberDbModel.find({ committeeId: theDataset.committeeId }))
      if (item.personId === viewerUserId) isCommittee = true;

    //   const evaluateEnabled =
    //     applicationData &&
    //     ["submitted", "approved", "rejected"].includes(applicationData.state);

    if (isEditor) {
      if (!['submitted', 'approved', 'rejected'].includes(theAppResult.state)) theAppResult.allowedStateActions.push('submit');
      if (!['submitted', 'approved', 'rejected'].includes(theAppResult.state)) theAppResult.allowedStateActions.push('edit');
    }
    if (isCommittee) {
      if (['submitted'].includes(theAppResult.state)) theAppResult.allowedStateActions.push('evaluate');
      if (['submitted'].includes(theAppResult.state)) theAppResult.allowedStateActions.push('approve');
      if (['approved'].includes(theAppResult.state)) theAppResult.allowedStateActions.push('unapprove');
    }
    return theAppResult;
  }

  /**
   * Approve an application.
   * NEEDS SECURITY CHECKS STILL.
   *
   * @param applicationId the application id to approve
   * @param approverUserId the user doing the approving
   * @return the full application model including new status and event
   */
  public async approveApplication(applicationId: string, approverUserId: string): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const transaction = {};
    await ApplicationDbModel.update({ id: applicationId, state: 'approved' }, { transaction });
    await ApplicationEventDbModel.create(
      {
        as: 'committee',
        byId: approverUserId,
        applicationId: applicationId,
        action: 'approve',
        detail: '',
      },
      { transaction },
    );
    await this.table.transact('write', transaction);

    return this.asApplication(applicationId, approverUserId);
  }

  /**
   * Unapprove an application.
   * NEEDS SECURITY CHECKS STILL.
   *
   * @param applicationId the application id to approve
   * @param unapproverUserId the user doing the approving
   * @return the full application model including new status and event
   */
  public async unapproveApplication(applicationId: string, unapproverUserId: string): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const transaction = {};
    await ApplicationDbModel.update({ id: applicationId, state: 'submitted' }, { transaction });
    await ApplicationEventDbModel.create(
      {
        as: 'committee',
        byId: unapproverUserId,
        applicationId: applicationId,
        action: 'unapprove',
        detail: '',
      },
      { transaction },
    );
    await this.table.transact('write', transaction);

    return this.asApplication(applicationId, unapproverUserId);
  }

  /**
   * Submit an application.
   * NEEDS SECURITY CHECKS STILL.
   *
   * @param applicationId the application id to submit
   * @param submitterUserId the user doing the submitting
   * @return the full application model including new status and event
   */
  public async submitApplication(applicationId: string, submitterUserId: string): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const transaction = {};
    await ApplicationDbModel.update({ id: applicationId, state: 'submitted' }, { transaction });
    await ApplicationEventDbModel.create(
      {
        as: 'committee',
        byId: submitterUserId,
        applicationId: applicationId,
        action: 'submit',
        detail: '',
      },
      { transaction },
    );
    await this.table.transact('write', transaction);

    return this.asApplication(applicationId, submitterUserId);
  }

  /**
   * Return a list of all the subjects/samples attached to a release application.
   *
   * @param applicationId
   */
  public async getApplicationReleaseSubjects(applicationId: string): Promise<ApplicationReleaseSubjectDbType[]> {
    const { ApplicationReleaseSubjectDbModel } = getTypes(this.table);

    const sorted: ApplicationReleaseSubjectDbType[] = [];
    {
      let aeNext: any = null;
      let aeItemPage: Paged<ApplicationReleaseSubjectDbType>;
      do {
        aeItemPage = await ApplicationReleaseSubjectDbModel.find({ applicationId: applicationId });

        for (const item of aeItemPage) {
          sorted.push(item);
        }

        aeNext = aeItemPage.next;
      } while (aeNext);
    }

    sorted.sort((a, b) => a.subjectId.localeCompare(b.subjectId));

    return sorted;
  }

  /**
   * Return a list of all *approved* application ids that this applicant is approved to access.
   *
   * @param subjectId
   */
  public async findApprovedApplicationsInvolvedAsApplicant(subjectId: string): Promise<string[]> {
    const { ApplicationDbModel } = getTypes(this.table);

    // find all applications this subject is involved with
    // we could probably approach this a variety of ways - starting with approved applications -> check for user
    // but this way has a reasonably self limiting bounds.. I mean how many applications _can_ a person
    // be involved with - whereas the number of approved applications could theoretically grow very large
    // in a heavily used system
    // for the moment I imagine it is much of a muchness
    const applications = await this.findInvolvedAsApplicant(subjectId);
    const results = new Set<string>([]);

    for (const appId of applications) {
      const appData = await ApplicationDbModel.get({ id: appId });

      if (appData.state == 'approved') results.add(appData.id);
    }

    return Array.from(results.values());
  }

  /**
   * Finds any application that are person is the PI etc on OR in which this person has made
   * a comment as a researcher.
   * NEEDS TIDYING.. FIX THE PAGING PATTERN
   * @param subjectId
   * @private
   */
  public async findInvolvedAsApplicant(subjectId: string): Promise<string[]> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const results = new Set<string>([]);

    for (const item of await ApplicationEventDbModel.find(
      { byId: subjectId, as: 'applicant' },
      {
        index: 'gs1',
        fields: ['applicationId'],
      },
    )) {
      results.add(item.applicationId);
    }

    for (const item of await ApplicationDbModel.find({ applicantId: subjectId }, { index: 'gs1' })) {
      results.add(item.id);
    }

    for (const item of await ApplicationDbModel.find({ principalInvestigatorId: subjectId }, { index: 'gs2' })) results.add(item.id);

    return Array.from(results.values());
  }

  /**
   * Find all the committees the given user is involved with and then via datasets use that
   * to find applications that share the committee.
   *
   * @param personId
   * @private
   */
  public async findInvolvedAsCommittee(personId: string): Promise<string[]> {
    const { CommitteeMemberDbModel, ApplicationDbModel, DatasetDbModel } = getTypes(this.table);

    // build a set of committees this person is in
    const committeeIds = new Set<string>([]);

    for (const item of await CommitteeMemberDbModel.find(
      { personId: personId },
      {
        index: 'gs1',
        fields: ['committeeId'],
      },
    ))
      committeeIds.add(item.committeeId);

    console.log(committeeIds);

    const datasetIds = new Set<string>([]);

    // now build a set of datasets that join to those committees
    for (const committeeId of committeeIds) {
      console.log(`Looking for all datasets involving committee ${committeeId}`);
      for (const item of await DatasetDbModel.find(
        { committeeId: committeeId },
        {
          index: 'gs1',
          fields: ['id'],
        },
      ))
        datasetIds.add(item.id);
    }

    const results = new Set<string>([]);

    for (const datasetId of datasetIds) {
      console.log(`Looking for all applications involving dataset ${datasetId}`);
      for (const item of await ApplicationDbModel.find(
        { datasetId: datasetId },
        {
          index: 'gs3',
          fields: ['id'],
        },
      ))
        results.add(item.id);
    }

    return Array.from(results.values());
  }
}

export const applicationServiceInstance = new ApplicationService();
