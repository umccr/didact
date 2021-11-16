import Dynamo from 'dynamodb-onetable/Dynamo';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getTable } from '../business/db/didact-table-utils';
import { ApplicationEventDbType, getTypes } from '../business/db/didact-table-types';
import { AnyEntity, Paged, Table } from 'dynamodb-onetable';
import { DataUseLimitation } from '../../../shared-src/api-models/data-use-limitation';
import { tengSingletons } from './setup-test-data-10g';

// whilst the user management is developed
export const PERSON_BOB = 'https://nagim.dev/p/ertyu-asrqe-34526';
export const PERSON_ALICE = 'https://nagim.dev/p/saqwfe-bvgfr-65987';
export const PERSON_ANDREW_UNI = 'https://nagim.dev/p/wjaha-ppqrg-10000';
export const PERSON_ANDREW_GMAIL = 'https://nagim.dev/p/kfuus-aodnv-10000';
export const PERSON_ANDREW_PATTO = 'https://nagim.dev/p/txtpo-yhphm-10000';
export const PERSON_DENIS_BAUER = 'https://nagim.dev/p/mbcxw-bpjwv-10000';
export const PERSON_YATISH_JAIN = 'https://nagim.dev/p/iryba-kskqa-10000';

// these will need to come from some sort of LDAP sync in reality
export const PERSON_NAMES = {
  [PERSON_ANDREW_UNI]: 'Andrew UniMelbPatterson',
  [PERSON_ANDREW_GMAIL]: 'Andrew GmailPatterson',
  [PERSON_ANDREW_PATTO]: 'Andrew PattoPatterson',
  [PERSON_ALICE]: 'Alice Smith',
  [PERSON_BOB]: 'Bob Wiseman',
  [PERSON_DENIS_BAUER]: 'Denis Bauer',
  [PERSON_YATISH_JAIN]: 'Yatish Jain',
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
    ApplicationReleaseSubjectDbModel,
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
      personId: PERSON_ANDREW_PATTO,
      role: 'member',
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
      description: 'A subset of 10 singleton subjects from the 1000g project',
      dataUses: [
        {
          code: { id: 'DUO:0000007', label: 'DS' },
          disease: { id: 'SNOMED:32895009', label: 'Hereditary disease' },
        },
      ],
    });

    let charles = undefined;
    let mary = undefined;
    let jane = undefined;

    for (const c of tengSingletons) {
      const s = await DatasetSubjectDbModel.create({
        datasetId: ds10g.id,
        subjectId: c.subjectId,
        sampleIds: new Set(c.sampleIds) as any,
      });
      if (s.subjectId === 'SINGLETONCHARLES') charles = s;
      if (s.subjectId === 'SINGLETONMARY') mary = s;
      if (s.subjectId === 'SINGLETONJANE') jane = s;
    }

    if (!charles || !mary || !jane) throw new Error("Didn't match subject ids to instances correctly");

    {
      const app10g = await ApplicationDbModel.create({
        id: '8XZF4195109CIIERC35P577HAM',
        applicantId: PERSON_ANDREW_PATTO,
        principalInvestigatorId: PERSON_BOB,
        datasetId: ds10g.id,
        projectTitle: 'Study of lissencephaly and in particular the DAG1 gene',
        researchUseStatement: 'Lorem ispum',
        snomed: new Set(['785299009' /*Cobblestone lissencephaly without muscular or ocular involvement*/]) as any,
        hgnc: new Set(['HGNC:2666' /*DAG1*/]) as any,
        // Chromosome 3: 49,468,703-49,535,618
        state: 'approved',
        htsgetEndpoint: 'https://htsget-apse2.dev.umccr.org',
        readsEnabled: false,
        variantsEnabled: true,
        fhirEndpoint: 'https://fhir.dev.umccr.org',
        phenotypesEnabled: true,
        panelappId: 6,
        panelappVersion: '1.0',
        panelappMinConfidence: 2,
      });

      await ApplicationEventDbModel.create({
        applicationId: app10g.id,
        action: 'create',
        when: new Date(2021, 4, 13, 15, 44, 21),
        byId: PERSON_ANDREW_PATTO,
        as: 'applicant',
        detail: 'initial submission data',
      });

      // we should fill in more events here - but for demo purposes not needed

      // we put this application into an automatically approved state
      // and include dataset details (that we would have built on approval by
      // querying gen3 etc)
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: mary.subjectId,
        sampleIds: Array.from(mary.sampleIds),
      });
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: charles.subjectId,
        sampleIds: Array.from(charles.sampleIds),
      });
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: jane.subjectId,
        sampleIds: Array.from(jane.sampleIds),
      });
    }

    {
      const partialApp10g = await ApplicationDbModel.create({
        id: '01FGX20E1919BZ3D09TP1MRQNR',
        applicantId: PERSON_ANDREW_UNI,
        principalInvestigatorId: PERSON_ANDREW_UNI,
        datasetId: ds10g.id,
        projectTitle: 'A Partial Application for 10G Data',
        researchUseStatement: 'This application is for research into ...',
        snomed: new Set([
          '718212006' /*TMEM70 related mitochondrial encephalo-cardio-myopathy*/,
          '126488004' /*cancer of skin*/,
          '472315005' /* mitocondrial cardiomyopathy*/,
        ]) as any,
        hgnc: new Set(['HGNC:123']) as any,
        state: 'submitted',
      });

      await ApplicationEventDbModel.create({
        applicationId: partialApp10g.id,
        action: 'create',
        when: new Date(2021, 4, 13, 15, 44, 21),
        byId: PERSON_ANDREW_PATTO,
        as: 'applicant',
        detail: 'I filled in all the data',
      });
    }

    // a CSIRO specific application
    {
      const app10g = await ApplicationDbModel.create({
        id: '1AAC4S95109XIIERC35P577OOO',
        applicantId: PERSON_YATISH_JAIN,
        principalInvestigatorId: PERSON_DENIS_BAUER,
        datasetId: ds10g.id,
        projectTitle: 'An Examination of 10 Samples by CSIRO',
        researchUseStatement: 'RUS',
        snomed: new Set(['718212006' /*TMEM70 related mitochondrial encephalo-cardio-myopathy*/]) as any,
        hgnc: new Set(['HGNC:123']) as any,
        state: 'approved',
        htsgetEndpoint: 'https://htsget-apse2.dev.umccr.org',
        readsEnabled: false,
        variantsEnabled: true,
        fhirEndpoint: 'https://fhir.dev.umccr.org',
        phenotypesEnabled: true,
        panelappId: 221,
        panelappVersion: '0.149',
        panelappMinConfidence: 3,
      });

      await ApplicationEventDbModel.create({
        applicationId: app10g.id,
        action: 'create',
        when: new Date(2021, 4, 13, 15, 44, 21),
        byId: PERSON_YATISH_JAIN,
        as: 'applicant',
        detail: 'I filled in all the data',
      });

      // we should fill in more events here - but for demo purposes not needed

      // we put this application into an automatically approved state
      // and include dataset details (that we would have built on approval by
      // querying gen3 etc)
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: mary.subjectId,
        sampleIds: Array.from(mary.sampleIds),
      });
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: jane.subjectId,
        sampleIds: Array.from(jane.sampleIds),
      });
      await ApplicationReleaseSubjectDbModel.create({
        applicationId: app10g.id,
        subjectId: charles.subjectId,
        sampleIds: Array.from(charles.sampleIds),
      });
    }
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
      // this is deliberately not a real snomed - it will be autoremoved on form edit
      snomed: new Set(['23423424']) as any,
      // this is deliberately not a real hgnc - it will be autoremoved on form edit
      hgnc: new Set(['HGNC:ABCDEF']) as any,
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
