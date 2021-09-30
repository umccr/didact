
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

    researchUseStatement: string,
    nonTechnicalStatement: string,

    state: string,

    // date of last update of *any* part of this application in UTC ISO format
    lastUpdated: string;

    events: ApplicationEventApiModel[];
};

export type ApplicationEventApiModel = {
    when: string;
    action: string;
    byId: string;
    byName: string;
    as: string;
    detail: string;
}
