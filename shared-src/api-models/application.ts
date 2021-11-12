export type ApplicationApiNewModel = {
  // NOTE: applicant id (implicit based on bearer token on /new API call)

  // the official PI of the study - may or may not be the applicant
  principalInvestigatorId: string;

  // the dataset being requested (could evolve into a set of datasets)
  datasetId: string;

  // the project title
  projectTitle: string;
};

export type ApplicationApiEditableModel = {
  researchUseStatement: string;

  // these are actually represented in other places as either Set of codes, or a dictionary keyed by
  // code - but for the purposes of API exchange we do them just as an array of codes
  snomed: string[];
  hgnc: string[];
};

// NOTE: these are shared with the actual database definitions - which I am dubious about - but
// you certainly can't just go changing these without thinking about the data that is *already* saved
// in a database with these values
const VALID_STATE_ENUM_VALUES = [
  "started",
  "submitted",
  "approved",
  "rejected",
] as const;

const VALID_ACTION_ENUM_VALUES = [
  "create",
  "edit",
  "comment",
  "submit",
  "unsubmit",
  "approve",
  "unapprove",
] as const;

export type ApplicationStateApiEnum = typeof VALID_STATE_ENUM_VALUES[number];
export type ApplicationActionApiEnum = typeof VALID_ACTION_ENUM_VALUES[number];

export type ApplicationApiBackendModel = {
  // id of the application itself as generated from the backend
  id: string;

  // who is the owner of the application
  applicantId: string;

  // the state machine current state
  state: ApplicationStateApiEnum;

  // based on who has fetched this application, this is the list of
  // actions that can be executed
  allowedStateActions: ApplicationActionApiEnum[];

  // date of last update of *any* part of this application in UTC ISO format
  lastUpdated: string;

  events: ApplicationEventApiModel[];

  // when (and only when) the state == "approved" for release, these fields
  // will contain details of the release
  release?: ApplicationReleaseApiModel;
};

export type ApplicationApiModel = ApplicationApiEditableModel &
  ApplicationApiNewModel &
  ApplicationApiBackendModel & {
    applicantDisplayName: string;
    principalInvestigatorDisplayName: string;
  };

export type ApplicationReleaseApiModel = {
  htsgetEndpoint?: string;
  readsEnabled: boolean;
  variantsEnabled: boolean;

  fhirEndpoint?: string;
  phenotypesEnabled: boolean;

  panelappId?: string;
  panelappVersion?: string;
  panelappDisplayName?: string;
  panelappMinConfidence?: number;

  subjects: ApplicationReleaseSubjectApiModel[];
};

export type ApplicationEventApiModel = {
  when: string;
  action: ApplicationActionApiEnum;
  byId: string;
  byName: string;
  as: string;
  detail: string;
};

export type ApplicationReleaseSubjectApiModel = {
  subjectId: string;
  sampleIds: string[];
};

/**
 * This is the submission
 */
export type ApplicationApproveApiModel = {
  readsEnabled: boolean,
  variantsEnabled: boolean,

  phenotypesEnabled: boolean,

  // allow the approver to specify the subjects.. in reality this would
  // need lots of double checking
  subjectIds: string[];

  // allow the approve to specify the panel to use
  panelappId?: number,
  panelappVersion?: string,
  panelappMinConfidence?: number;
};
