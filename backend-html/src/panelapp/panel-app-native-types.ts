/*
  These are all the type definitions representing panelapp data AS LOADED FROM THE PANELAPP API - and stored
  on disk in JSON format.
  
  So we are not in charge of these field names etc - they should match the PanelApp API.
 */

export type PanelAppEntry = {
  id: number;
  hash_id: null;
  name: string;
  disease_group: string;
  disease_sub_group: string;
  status: string;
  version: string;
  version_created: string;
  relevant_disorders: string[];
  stats: PanelAppEntryStats;
  types: PanelAppEntryType[];
  genes?: PanelAppEntryGene[];
};

export type PanelAppEntryType = {
  name: string;
  slug: string;
  description: string;
};

export type PanelAppEntryStats = {
  number_of_genes: number;
  number_of_strs: number;
  number_of_regions: number;
};

export type PanelAppEntryGene = {
  gene_data: PanelAppEntryGeneData;
  entity_type: string;
  entity_name: string;
  confidence_level: string;
  penetrance: string;
  mode_of_pathogenicity: null;
  publications: string[];
  evidence: string[];
  phenotypes: string[];
  mode_of_inheritance: string;
  tags: string[];
  transcript: null | string[];
};

// {
//         "alias": [
//           "K-REV",
//           "RAL1B",
//           "DKFZp586H0723"
//         ],
//         "biotype": "protein_coding",
//         "hgnc_id": "HGNC:9857",
//         "gene_name": "RAP1B, member of RAS oncogene family",
//         "omim_gene": [
//           "179530"
//         ],
//         "alias_name": null,
//         "gene_symbol": "RAP1B",
//         "hgnc_symbol": "RAP1B",
//         "hgnc_release": "2017-11-03",
//         "ensembl_genes": {
//           "GRch37": {
//             "82": {
//               "location": "12:69004619-69054372",
//               "ensembl_id": "ENSG00000127314"
//             }
//           },
//           "GRch38": {
//             "90": {
//               "location": "12:68610839-68671901",
//               "ensembl_id": "ENSG00000127314"
//             }
//           }
//         },
//         "hgnc_date_symbol_changed": "1989-06-30"
//       }

export type PanelAppEntryGeneData = {
  alias: string[];
  biotype: string;
  hgnc_id: string;
  gene_name: string;
  omim_gene: string[];
  alias_name: string | null;
  gene_symbol: string;
  hgnc_symbol: string;
  hgnc_release: string;
  ensembl_genes: any;
};
