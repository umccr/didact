export type PanelappPanelApiModel = {
    id: string;
    name: string;
    version: string;
    // if explicitly asked for, panelapp can also include details of the genes
    genes?: PanelappPanelGeneApiModel[];
};

export type PanelappPanelGeneApiModel = {
    id: string;
    symbol: string;
    confidence: number;
    grch38Chr: string;
    grch38Start: number;
    grch38End: number;
    grch38EnsemblRelease: string;
    grch38EnsemblId: string;
}
