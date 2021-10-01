
export type ApplicationApiNewModel = {
    // NOTE: applicant id (implicit based on bearer token on /new API call)

    // the official PI of the study - may or may not be the applicant
    principalInvestigatorId: string,

    // the dataset being requested (could evolve into a set of datasets)
    datasetId: string,

    // the project title
    projectTitle: string,
}

export type ApplicationApiModel = ApplicationApiNewModel & {
    id: string;

    // who is the owner of the application
    applicantId: string,
    applicantDisplayName: string,

    principalInvestigatorDisplayName: string,

    state: string,

    researchUseStatement: string,
    nonTechnicalStatement: string,

    // these are actually represented in other places as either Set of codes, or a dictionary keyed by
    // code - but for the purposes of API exchange we do them just as an array of codes
    snomed: string[];
    hgnc: string[];

    // date of last update of *any* part of this application in UTC ISO format
    lastUpdated: string;

    events: ApplicationEventApiModel[];

    // when (and only when) the state == "approved" for release, these fields
    // will contain details of the release
    release?: ApplicationReleaseApiModel
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
}

export type ApplicationEventApiModel = {
    when: string;
    action: string;
    byId: string;
    byName: string;
    as: string;
    detail: string;
}

export type ApplicationReleaseSubjectApiModel = {
    subjectId: string;
    sampleIds: string[];
}
