const Match = {
  urn: /^urn:[a-z0-9][a-z0-9-]{0,31}:[a-z0-9()+,\-.:=@;$_!*'%/?#]+$/i,
  ulid: /^[0-9A-Z]{26}$/i,
  identifier: /^[A-Za-z0-9\-\\.]{1,64}$/,
  name: /^[a-z0-9 ,.'-]+$/i,
  address: /[a-z0-9 ,.-]+$/,
  zip: /^\d{5}(?:[-\s]\d{4})?$/,
};

export const DidactTableSchema = {
  indexes: {
    primary: { hash: 'pk', sort: 'sk' },
    gs1: { hash: 'gs1pk', sort: 'gs1sk', project: 'all' },
    gs2: { hash: 'gs2pk', sort: 'gs2sk', project: 'all' },
    gs3: { hash: 'gs3pk', sort: 'gs3sk', project: 'all' },
  },
  models: {
    Dataset: {
      pk: { type: String, value: 'ds#${id}' },
      sk: { type: String, value: 'ds#' },
      id: { type: String, required: true, validate: Match.urn },
      name: { type: String, required: true },
      description: { type: String },
      // the committee that is assigned to deal with this dataset
      committeeId: { type: String, required: true },
      dataUses: { type: Array, required: true },

      // index dataset.committeeId -> dataset.id
      gs1pk: { type: String, value: 'ds#${committeeId}' },
      gs1sk: { type: String, value: 'ds#${id}' },
    },
    DatasetSubject: {
      pk: { type: String, value: 'ds#${datasetId}' },
      sk: { type: String, value: 'dsSub#${subjectId}' },
      datasetId: { type: String, required: true },
      subjectId: { type: String, required: true, validate: Match.identifier },
      familyId: { type: String, validate: Match.identifier },
      sampleIds: { type: Set },
    },
    Committee: {
      pk: { type: String, value: 'committee#${id}' },
      sk: { type: String, value: 'committee#' },
      id: { type: String, uuid: true, validate: Match.ulid },
      name: { type: String },
      custodian: { type: String, required: true },
      voting: { type: String, enum: ['majority', 'unanimous'], required: true, default: 'majority' },
    },
    CommitteeMember: {
      pk: { type: String, value: 'committee#${committeeId}' },
      sk: { type: String, value: 'committeeMember#${personId}' },
      // the pointer up to the committee this person is a member of
      committeeId: { type: String, required: true },
      // the person
      personId: { type: String, required: true },
      // the role of the person in this committee
      role: { type: String, enum: ['administrator', 'chair', 'member'], required: true },

      // index committeeMember.personId -> committee.id
      gs1pk: { type: String, value: 'committeeMember#${personId}' },
      gs1sk: { type: String, value: 'committee#${committeeId}' },
    },
    Application: {
      pk: { type: String, value: 'app#${id}' },
      sk: { type: String, value: 'app#' },
      id: { type: String, uuid: true, validate: Match.ulid },

      //  initial values required on creation
      applicantId: { type: String, required: true },
      principalInvestigatorId: { type: String, required: true },
      datasetId: { type: String, required: true },
      projectTitle: { type: String, required: true },
      state: { type: String, enum: ['started', 'submitted', 'approved', 'rejected'], required: true },
      // fields that can be edited during application process
      researchUseStatement: { type: String, required: false },
      nonTechnicalStatement: { type: String, required: false },

      // indexes - we need to be able to lookup applications by
      // applicantId
      // principalInvestigatorId
      // datasetId
      gs1pk: { type: String, value: 'app#${applicantId}' },
      gs1sk: { type: String, value: 'app#${id}' },
      gs2pk: { type: String, value: 'app#${principalInvestigatorId}' },
      gs2sk: { type: String, value: 'app#${id}' },
      gs3pk: { type: String, value: 'app#${datasetId}' },
      gs3sk: { type: String, value: 'app#${id}' },
    },
    ApplicationEvent: {
      pk: { type: String, value: 'app#${applicationId}' },
      sk: { type: String, value: 'appEv#${id}' },
      applicationId: { type: String, required: true },
      id: { type: String, uuid: true, validate: Match.ulid },
      when: { type: Date, default: () => new Date() },
      action: { type: String, enum: ['create', 'edit', 'comment', 'submit', 'unsubmit', 'approve', 'unapprove'], required: true },
      byId: { type: String, required: true },
      as: { type: String, enum: ['applicant', 'committee'], required: true },
      detail: { type: String, required: true },

      // we index such that we can quickly discover for any applicant which applications they have
      // been involved in
      gs1pk: { type: String, value: 'appEv#${byId}' },
      gs1sk: { type: String, value: 'app#${applicationId}' },
    },
    ApplicationReleaseArtifact: {
      pk: { type: String, value: 'app#${applicationId}' },
      sk: { type: String, value: 'appRelArt#${id}' },
      applicationId: { type: String, required: true },
      id: { type: String, uuid: true, validate: Match.ulid },
      sampleId: { type: String, required: true },
      path: { type: String, required: true },
      // a temp modelling technique to show selective access to chromosomes
      // if present space separated list of allowed chromosomes
      chromosomes: { type: String },
    },
  },
};
