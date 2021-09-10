
export type ReleaseManifestApiModel = {
    id: string;
    htsgetUrl: string;
    artifacts: { [htsgetId: string]: ReleaseManifestRuleApiModel; }
};

export type ReleaseManifestRuleApiModel = {
    chromosomes_only?: string[];
}

export type ReleaseArtifactApiModel = {
    path: string;
    chromosomes?: string[];
}
