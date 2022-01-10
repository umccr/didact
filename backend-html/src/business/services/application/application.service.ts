/**
 * The dataset service provides business layer functionality around
 * datasets.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { AnyEntity, Paged, Table } from 'dynamodb-onetable';
import { getTable } from '../../db/didact-table-utils';
import { ApplicationDbType, ApplicationEventDbType, ApplicationReleaseSubjectDbType, getTypes } from '../../db/didact-table-types';
import {
  ApplicationApiEditableModel,
  ApplicationApiModel,
  ApplicationApproveApiModel,
  ApplicationStateApiEnum,
} from '../../../../../shared-src/api-models/application';
import { PERSON_NAMES } from '../../../testing/setup-test-data';
import _ from 'lodash';
import { tengSingletons } from '../../../testing/setup-test-data-10g';

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
      detail: undefined,
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
   * @param viewerUserId the id of the user viewing this application or null to indicate this is a system level view
   *
   * Notes:
   * when null is passed to the viewerUserId, the allowedActions field will be left empty
   */
  public async asApplication(applicationId: string, viewerUserId: string | null): Promise<ApplicationApiModel | null> {
    const { ApplicationDbModel, ApplicationEventDbModel, DatasetDbModel, CommitteeMemberDbModel } = getTypes(this.table);

    const theApp = await ApplicationDbModel.get({ id: applicationId });

    if (!theApp) return null;

    const theDataset = await DatasetDbModel.get({ id: theApp.datasetId });

    if (!theDataset) return null;

    const theAppResult: ApplicationApiModel = {
      id: theApp.id,
      state: theApp.state as ApplicationStateApiEnum,
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
    };

    const eventsSorted = [];
    {
      let aeNext: any = null;
      let aeItemPage: Paged<ApplicationEventDbType>;
      do {
        aeItemPage = await ApplicationEventDbModel.find({ applicationId: applicationId });

        for (const item of aeItemPage) {
          const newEvent = {
            when: item.when.toJSON(),
            byId: item.byId,
            byName: PERSON_NAMES[item.byId],
            as: item.as,
            action: item.action,
          };
          if (item.detail) newEvent['detail'] = item.detail;

          eventsSorted.push(newEvent);
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
        panelappDisplayName: 'TBD',
        htsgetEndpoint: theApp.htsgetEndpoint,
        fhirEndpoint: theApp.fhirEndpoint,
        subjects: [],
      };
      if (theApp.panelappId && theApp.panelappVersion && theApp.panelappMinConfidence) {
        theAppResult.release.panelappId = theApp.panelappId.toString();
        theAppResult.release.panelappVersion = theApp.panelappVersion;
        theAppResult.release.panelappMinConfidence = theApp.panelappMinConfidence;
      }
      theAppResult.release.subjects = dbSubjects.map(rs => {
        return {
          subjectId: rs.subjectId,
          sampleIds: Array.from(rs.sampleIds),
        };
      });
    }

    theAppResult.lastUpdated = eventsSorted[0].when;
    theAppResult.events = eventsSorted;

    console.log(`Making transition choices ${viewerUserId}`);
    // TODO: all the logic for state transition permissions
    // should move into a function and be used as guards for the actual transition methods too
    if (viewerUserId) {
      const isEditor = theAppResult.principalInvestigatorId == viewerUserId || theAppResult.applicantId == viewerUserId;

      let isCommittee = false;

      for (const item of await CommitteeMemberDbModel.find({ committeeId: theDataset.committeeId }))
        if (item.personId === viewerUserId) isCommittee = true;

      // some experimental logic - if someone is both an editor of an application *and* on the committee for
      // the data (shouldn't happen but I can conceive of it) - then we automatically remove them from the committee
      // permissions
      if (isCommittee && isEditor) isCommittee = false;

      if (isEditor) {
        switch (theAppResult.state) {
          case 'started':
            theAppResult.allowedStateActions.push('submit', 'edit');
            break;
          case 'submitted':
            break;
          case 'approved':
            break;
          case 'rejected':
            break;
        }
      }
      if (isCommittee) {
        switch (theAppResult.state) {
          case 'started':
            theAppResult.allowedStateActions.push('comment');
            break;
          case 'submitted':
            theAppResult.allowedStateActions.push('approve');
            break;
          case 'approved':
            theAppResult.allowedStateActions.push('unapprove');
            break;
          case 'rejected':
            break;
        }
      }
    }

    return theAppResult;
  }

  /**
   * Approve an application.
   * NEEDS SECURITY CHECKS STILL.
   *
   * @param applicationId the application id to approve
   * @param approverUserId the user doing the approving
   * @param approveData the posted data indicating details of the approval
   * @return the full application model including new status and event
   */
  public async approveApplication(
    applicationId: string,
    approverUserId: string,
    approveData: ApplicationApproveApiModel,
  ): Promise<ApplicationApiModel> {
    const { ApplicationDbModel, DatasetDbModel, ApplicationReleaseSubjectDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const theApp = await ApplicationDbModel.get({ id: applicationId });

    if (!theApp) return null;

    const theDataset = await DatasetDbModel.get({ id: theApp.datasetId });

    if (!theDataset) return null;

    const transaction = {};

    // whilst there are a lot of similarities - there is not a 1:1 correspondence between the Approve data we get
    // sent and our updated db state (for instance - we need to do some basic checking)
    // so lets make the db object
    const dbApproveData: Partial<ApplicationDbType> = {
      id: applicationId,
      state: 'approved',
      readsEnabled: approveData.readsEnabled,
      variantsEnabled: approveData.variantsEnabled,
      phenotypesEnabled: approveData.phenotypesEnabled,
    };
    if (approveData.panelappId && approveData.panelappVersion && approveData.panelappMinConfidence) {
      dbApproveData.panelappId = approveData.panelappId;
      dbApproveData.panelappVersion = approveData.panelappVersion;
      dbApproveData.panelappMinConfidence = approveData.panelappMinConfidence;
    }
    if (approveData.phenotypesEnabled) {
      dbApproveData.fhirEndpoint = 'https://nagim.pathling.app';
    }
    if (approveData.readsEnabled || approveData.variantsEnabled) {
      dbApproveData.htsgetEndpoint = 'https://htsget-apse2.dev.umccr.org';
    }

    for (const s of approveData.subjectIds) {
      for (const reference of tengSingletons) {
        if (s === reference.subjectId) {
          await ApplicationReleaseSubjectDbModel.create(
            {
              applicationId: theApp.id,
              subjectId: s,
              sampleIds: new Set(reference.sampleIds) as any,
            },
            { transaction },
          );
        }
      }
    }

    await ApplicationDbModel.update(dbApproveData, { transaction });
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
    const { ApplicationDbModel, ApplicationReleaseSubjectDbModel, ApplicationEventDbModel } = getTypes(this.table);

    // TODO: would need to place this inside the transaction..
    const subs = await ApplicationReleaseSubjectDbModel.find({ applicationId: applicationId }, {});

    const transaction = {};
    await ApplicationDbModel.update(
      {
        id: applicationId,
        state: 'submitted',
        // we need to ensure we remove any state that might have been saved from the previous approval
        fhirEndpoint: undefined,
        htsgetEndpoint: undefined,
        phenotypesEnabled: undefined,
        readsEnabled: undefined,
        variantsEnabled: undefined,
        panelappMinConfidence: undefined,
        panelappVersion: undefined,
        panelappId: undefined,
      },
      { transaction },
    );
    for (const s of subs) {
      await ApplicationReleaseSubjectDbModel.remove({ applicationId: applicationId, subjectId: s.subjectId }, { transaction });
    }
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
