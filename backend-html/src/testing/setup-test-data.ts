import Dynamo from 'dynamodb-onetable/Dynamo';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getTable } from '../business/db/didact-table-utils';
import { ApplicationEventDbType, getTypes } from '../business/db/didact-table-types';
import { AnyEntity, Paged, Table } from 'dynamodb-onetable';
import { DataUseLimitation } from '../../../shared-src/api-models/data-use-limitation';

// whilst the user management is developed
export const PERSON_BOB = 'https://nagim.dev/p/ertyu-asrqe-34526';
export const PERSON_ALICE = 'https://nagim.dev/p/saqwfe-bvgfr-65987';
export const PERSON_ANDREW_UNI = 'https://nagim.dev/p/wjaha-ppqrg-10000';
export const PERSON_ANDREW_GMAIL = 'https://nagim.dev/p/kfuus-aodnv-10000';

export const PERSON_NAMES = {
  [PERSON_ANDREW_UNI]: 'Andrew Patterson Uni',
  [PERSON_ANDREW_GMAIL]: 'Andrew Patterson Gmail',
  [PERSON_ALICE]: 'Alice Smith',
  [PERSON_BOB]: 'Bob Wiseman',
};

async function anyData(t: Table): Promise<boolean> {
  // initiate a first page scan - and if we get anything back - then we have data!
  const itemPage = await t.scanItems({}, { limit: 25 });

  for (const _ of itemPage) {
    return true;
  }

  return false;
}

async function deleteAll(t: Table): Promise<void> {
  // exceedingly destructively remove all existing items.. we should make some way that this only
  // works on dev accounts on dev tables
  let next: any = null;
  let itemPage: Paged<AnyEntity>;
  do {
    itemPage = await t.scanItems({}, { next, limit: 25 });

    for (const item of itemPage) {
      await t.deleteItem({ pk: item.pk.S, sk: item.sk.S });
    }

    next = itemPage.next;
  } while (itemPage.next);
}

/**
 * Sets up a bunch of realistic test data - both for unit/functional testing and for demonstrating
 * software.
 *
 * @param canDestroyExistingData if true will delete existing data in the db, otherwise will only add data if the whole db is empty
 */
export async function setupTestData(canDestroyExistingData: boolean) {
  const client = new Dynamo({
    client: new DynamoDBClient({}),
  });

  const table = getTable(client);

  if (!canDestroyExistingData) {
    // if we find anything and we are not in super destructive mode, then just return
    if (await anyData(table)) return;
  }

  await deleteAll(table);

  const {
    DatasetDbModel,
    DatasetSubjectDbModel,
    CommitteeDbModel,
    CommitteeMemberDbModel,
    ApplicationDbModel,
    ApplicationEventDbModel,
    ApplicationReleaseArtifactDbModel,
  } = getTypes(table);

  let c1;
  {
    c1 = await CommitteeDbModel.create({
      name: 'Cancer DAC',
      custodian: 'alice@net',
      voting: 'majority',
    });

    await CommitteeMemberDbModel.create({
      committeeId: c1.id,
      personId: PERSON_ALICE,
      role: 'administrator',
    });
  }

  let c2;
  {
    c2 = await CommitteeDbModel.create({
      name: 'Germline DAC',
      custodian: 'andrew@net',
      voting: 'majority',
    });

    await CommitteeMemberDbModel.create({
      committeeId: c2.id,
      personId: PERSON_ANDREW_GMAIL,
      role: 'administrator',
    });

    await CommitteeMemberDbModel.create({
      committeeId: c2.id,
      personId: PERSON_ALICE,
      role: 'member',
    });
  }

  {
    await DatasetDbModel.create({
      id: 'urn:fdc:australiangenomics.org.au:2018:study/1',
      name: 'Mitochondrial Flagship',
      committeeId: c2.id,
      description: '45 participants with mitochondrial disorders',
      dataUses: [
        {
          code: { id: 'DUO:0000004', label: 'NRES' },
          modifiers: [],
        },
      ],
    });
  }

  /**
   * The 10g project - a proper fake dataset.
   */
  {
    const ds10g = await DatasetDbModel.create({
      id: 'urn:fdc:thetengenomeproject.org:2018:phase1',
      name: '10g Project',
      committeeId: c2.id,
      description: 'A subset of 10 subjects from the 1000g project',
      dataUses: [
        {
          code: { id: 'DUO:0000006', label: 'HMB' },
          modifiers: [],
        },
      ],
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      subjectId: 'SINGLETONA',
      sampleIds: new Set(['HG00096']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      subjectId: 'SINGLETONB',
      sampleIds: new Set(['HG00097']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      subjectId: 'SINGLETONC',
      sampleIds: new Set(['HG00099']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      subjectId: 'SOMATICA',
      sampleIds: new Set(['HG00100-TBD', 'HG00101-TBD']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      subjectId: 'SOMATICB',
      sampleIds: new Set(['HG00099']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      familyId: 'SIMPSONS',
      subjectId: 'TRIOHOMER',
      sampleIds: new Set(['HG00102-TBD']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      familyId: 'SIMPSONS',
      subjectId: 'TRIOMARGE',
      sampleIds: new Set(['HG00103-TBD']) as any,
    });

    await DatasetSubjectDbModel.create({
      datasetId: ds10g.id,
      familyId: 'SIMPSONS',
      subjectId: 'TRIOBART',
      sampleIds: new Set(['HG00104-TBD']) as any,
    });


    const app10g = await ApplicationDbModel.create({
      id: '8XZF4195109CIIERC35P577HAM',
      applicantId: PERSON_ANDREW_UNI,
      principalInvestigatorId: PERSON_BOB,
      datasetId: ds10g.id,
      projectTitle: 'Selective access to variant data',
      researchUseStatement: 'Can we do it',
      nonTechnicalStatement: 'Simpler',
      state: 'approved',
    });

    await ApplicationEventDbModel.create({
      applicationId: app10g.id,
      action: 'create',
      when: new Date(2021, 4, 13, 15, 44, 21),
      byId: PERSON_ANDREW_UNI,
      as: 'applicant',
      detail: 'I filled in all the data',
    });

    // we should fill in more events here - but for demo purposes not needed

    // we put this application into an automatically approved state
    // and include dataset details (that we would have built on approval by
    // querying gen3 etc)
    await ApplicationReleaseArtifactDbModel.create({
      applicationId: app10g.id,
      sampleId: 'HG00096',
      path: 'reads/10g/https/HG00096',
    });
    await ApplicationReleaseArtifactDbModel.create({
      applicationId: app10g.id,
      sampleId: 'HG00096',
      path: 'variants/10g/https/HG00096',
    });
    await ApplicationReleaseArtifactDbModel.create({
      applicationId: app10g.id,
      sampleId: 'HG00097',
      path: 'variants/10g/https/HG00097',
      chromosomes: 'chr1 chr2 chr3',
    });
    await ApplicationReleaseArtifactDbModel.create({
      applicationId: app10g.id,
      sampleId: 'HG00099',
      path: 'variants/10g/https/HG00099',
      chromosomes: 'chr1 chr11 chr12',
    });
  }

  {
    const ds2dataUseParkville: DataUseLimitation = {
      code: { id: 'DUO:0000006', label: 'HMB' },
      modifiers: [{ code: { id: 'DUO:0000028', label: 'IS' }, institutes: [{ id: 'https://ror.org/01b6kha49', label: 'WEHI' }] }],
    };

    const ds2dataUse: DataUseLimitation = {
      code: { id: 'DUO:0000007', label: 'DS' },
      disease: { id: 'SNOMED:49601007', label: 'Cardiovascular disease' },
      modifiers: [{ code: { id: 'DUO:0000025', label: 'TS' }, start: '2022-01-01' }],
    };

    await DatasetDbModel.create({
      id: 'urn:fdc:australiangenomics.org.au:2018:study/2',
      name: 'Heart Flagship',
      committeeId: c2.id,
      description: '45 participants with various types of heart disease',
      dataUses: [ds2dataUseParkville, ds2dataUse],
    });
  }

  {
    await DatasetDbModel.create({
      id: 'urn:fdc:australiangenomics.org.au:2018:study/3',
      name: 'Cancer Flagship',
      committeeId: c1.id,
      description: 'A comprehensive cohort of all types of cancer from 1 million participants',
      dataUses: [
        {
          code: { id: 'DUO:0000007', label: 'DS' },
          disease: { id: 'SNOMED:363346000', label: 'Malignant neoplastic disease' },
          modifiers: [{ code: { id: 'DUO:0000025', label: 'TS' }, start: '2021-03-01' }],
        },
      ],
    });
  }

  // andrew is applying for access to the cancer flagship data, with bob as PI
  // alice is on the corresponding committee
  {
    const app1 = await ApplicationDbModel.create({
      // id would normally be left out and will be autocreated - but for consistency of test scenarios
      // we actually set it here in the test data
      id: '0RAP8I75101YTG08C454H7DME3',
      applicantId: PERSON_ANDREW_UNI,
      principalInvestigatorId: PERSON_BOB,
      datasetId: 'urn:fdc:australiangenomics.org.au:2018:study/3',
      projectTitle: 'Use of Data in Genomic Research Study',
      researchUseStatement: 'We are intending to study things',
      nonTechnicalStatement: 'Simpler',
      state: 'started',
    });

    await ApplicationEventDbModel.create({
      applicationId: app1.id,
      action: 'create',
      when: new Date(2021, 4, 13, 15, 44, 21),
      byId: PERSON_ANDREW_UNI,
      as: 'applicant',
      detail: 'was good',
    });

    await ApplicationEventDbModel.create({
      applicationId: app1.id,
      action: 'comment',
      when: new Date(2021, 4, 15, 9, 12, 0),
      byId: PERSON_ALICE,
      as: 'committee',
      detail: 'This does not have enough detail',
    });

    await ApplicationEventDbModel.create({
      applicationId: app1.id,
      action: 'comment',
      when: new Date(2021, 4, 16, 15, 44, 21),
      byId: PERSON_ANDREW_UNI,
      as: 'applicant',
      detail: 'I made some changes now',
    });
  }

  // bob is applying for access to the heart flagship
  {
    const app2 = await ApplicationDbModel.create({
      id: '0WAP8I751047AH9A2T2883C66Z',
      applicantId: PERSON_BOB,
      principalInvestigatorId: PERSON_BOB,
      datasetId: 'urn:fdc:australiangenomics.org.au:2018:study/2',
      projectTitle: 'Hearts - Do we Need Them?',
      researchUseStatement: 'Hearts',
      nonTechnicalStatement: 'Tickety thing',
      state: 'started',
    });

    await ApplicationEventDbModel.create({
      applicationId: app2.id,
      action: 'create',
      byId: PERSON_BOB,
      as: 'applicant',
      detail: 'was good',
    });
  }
}
