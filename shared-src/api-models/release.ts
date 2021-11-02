/**
 * The Manifest model is the data the the DAC exposes to any participant
 * of data sharing for a particular data access release.
 * It should have enough data that data holders can use the manifest
 * (from a trusted source) for making authorisation decisions.
 */
export type ReleaseManifestApiModel = {
    id: string;

    // the superset of all patient ids that are in this data release
    patientIds: string[];

    htsgetUrl: string;
    htsgetArtifacts: { [patientId: string]: ReleaseManifestArtifactsApiModel; }
    htsgetRegions: ReleaseManifestRegionApiModel[];

    fhirUrl: string;
    fhirPatients: { [patientId: string]: ReleaseManifestPatientApiModel; }

};

export type ReleaseManifestRegionApiModel = {
    chromosome: string;
    start?: number;
    end?: number;
}

export type ReleaseManifestArtifactsApiModel = {
    samples: { [sampleId: string]: ReleaseManifestSampleApiModel; }
}

type ReleaseManifestPatientApiModel = {
}

 type ReleaseManifestSampleApiModel = {
    variantsPath?: string;
    readsPath?: string;
}




