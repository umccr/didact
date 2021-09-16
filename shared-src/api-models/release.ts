
export type ReleaseManifestApiModel = {
    id: string;
    htsgetUrl: string;
    htsgetArtifacts: { [htsgetPath: string]: ReleaseManifestArtifactApiModel; }
};

export type ReleaseManifestArtifactApiModel = {
    sampleId: string;
    restrictToRegions?: ReleaseManifestRuleSpecificApiModel[];
}

type ReleaseManifestRuleSpecificApiModel = {
    chromosome: string;
    // ensemblGeneIds?: string[];
}




