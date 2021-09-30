/**
 * The dataset service provides business layer functionality around
 * datasets.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { AnyEntity, Paged, Table } from "dynamodb-onetable";
import { getTable } from '../db/didact-table-utils';
import { ApplicationEventDbType, ApplicationReleaseArtifactDbType, getTypes } from "../db/didact-table-types";
import { ApplicationApiModel } from '../../../../shared-src/api-models/application';
import { PERSON_NAMES } from '../../testing/setup-test-data';

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
      researchUseStatement: 'default RUS statement',
      nonTechnicalStatement: 'default non tech statement',
      state: 'started',
    });

    await ApplicationEventDbModel.create({
      as: 'applicant',
      byId: applicantId,
      applicationId: newApp.id,
      action: 'create',
      detail: '',
    });

    return this.asApplication(newApp.id);
  }

  /**
   * List all the applications involving the given user identity - where they are involved as a researcher.
   * @param userId
   */
  public async listByUserAsResearcher(userId: string): Promise<ApplicationApiModel[]> {
    const applicationIds = await this.findInvolvedAsApplicant(userId);

    const results = [];

    for (const a of applicationIds) results.push(await this.asApplication(a));

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

    for (const a of applicationIds) results.push(await this.asApplication(a));

    return results;
  }

  /**
   * For the given application id return the complete API model consisting of
   * nested events etc. If application is not found returns null.
   *
   * @param applicationId
   */
  public async asApplication(applicationId: string): Promise<ApplicationApiModel | null> {
    const { ApplicationDbModel, ApplicationEventDbModel } = getTypes(this.table);

    const theApp = await ApplicationDbModel.get({ id: applicationId });

    if (!theApp) return null;

    const theAppResult: ApplicationApiModel = {
      id: theApp.id,
      state: theApp.state,
      datasetId: theApp.datasetId,
      projectTitle: theApp.projectTitle,
      researchUseStatement: theApp.researchUseStatement,
      nonTechnicalStatement: theApp.nonTechnicalStatement,
      applicantId: theApp.applicantId,
      applicantDisplayName: PERSON_NAMES[theApp.applicantId],
      principalInvestigatorId: theApp.principalInvestigatorId,
      principalInvestigatorDisplayName: PERSON_NAMES[theApp.principalInvestigatorId],
      // note: both of these data states is invalid in the API - they *will* be replaced with
      // a proper lastUpdated data and at least one event - or we will throw an exception later
      lastUpdated: '',
      events: [],
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

    theAppResult.lastUpdated = eventsSorted[0].when;
    theAppResult.events = eventsSorted;

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

    return this.asApplication(applicationId);
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

    return this.asApplication(applicationId);
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

    return this.asApplication(applicationId);
  }

  /**
   * Return a list of all the artifacts that are allowed as part of application.
   *
   * @param applicationId
   */
  public async getApplicationReleaseArtifacts(applicationId: string): Promise<ReleaseArtifactModel[]> {
    const { ApplicationReleaseArtifactDbModel } = getTypes(this.table);

    const artifactsSorted: ReleaseArtifactModel[] = [];
    {
      let aeNext: any = null;
      let aeItemPage: Paged<ApplicationReleaseArtifactDbType>;
      do {
        aeItemPage = await ApplicationReleaseArtifactDbModel.find({ applicationId: applicationId });

        for (const item of aeItemPage) {
          artifactsSorted.push({
            sampleId: item.sampleId,
            path: item.path,
            chromosomes: item.chromosomes ? item.chromosomes.split(' ') : [],
          });
        }

        aeNext = aeItemPage.next;
      } while (aeNext);
    }

    artifactsSorted.sort((a, b) => a.path.localeCompare(b.path));

    return artifactsSorted;
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

    for (const item of await ApplicationEventDbModel.find({ byId: subjectId, as: 'applicant' }, { index: 'gs1', fields: ['applicationId'] }))
      results.add(item.applicationId);

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

    for (const item of await CommitteeMemberDbModel.find({ personId: personId }, { index: 'gs1', fields: ['committeeId'] }))
      committeeIds.add(item.committeeId);

    console.log(committeeIds);

    const datasetIds = new Set<string>([]);

    // now build a set of datasets that join to those committees
    for (const committeeId of committeeIds) {
      console.log(`Looking for all datasets involving committee ${committeeId}`);
      for (const item of await DatasetDbModel.find({ committeeId: committeeId }, { index: 'gs1', fields: ['id'] })) datasetIds.add(item.id);
    }

    const results = new Set<string>([]);

    for (const datasetId of datasetIds) {
      console.log(`Looking for all applications involving dataset ${datasetId}`);
      for (const item of await ApplicationDbModel.find({ datasetId: datasetId }, { index: 'gs3', fields: ['id'] })) results.add(item.id);
    }

    return Array.from(results.values());
  }
}

export const applicationServiceInstance = new ApplicationService();
