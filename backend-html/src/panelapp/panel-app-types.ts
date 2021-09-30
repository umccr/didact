/**
 * These are the types that we use for passing around *our* API..
 */

export class PanelAppPanel {
  id: number;
  name: string;
  version: string;

  genes: PanelAppPanelGene[];
}

export class PanelAppPanelGene {
  id: string;
  symbol: string;
  confidence: number; // panel app confidence number 1=red, 2=amber, 3=green
  grch38Chr: string;
  grch38Start: number;
  grch38End: number;
  grch38EnsemblRelease: string;
  grch38EnsemblId: string;
}
