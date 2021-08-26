import { DataUseModifier } from "./data-use-modifier";
import { IOntology } from "./_data-use.interface";


type GeneralResearchUseCode = { id: 'DUO:0000042'; label: 'GRU' };
/**/ type HealthMedicalBiomedicalResearchCode = { id: 'DUO:0000006'; label: 'HMB' };
/**/ /**/ type DiseaseSpecificResearchCode = { id: 'DUO:0000007'; label: 'DS' };
/**/ type PopulationAncestryResearchOnlyCode = { id: 'DUO:0000011'; label: 'POA' };
type NoRestrictionCode = { id: 'DUO:0000004'; label: 'NRES' };


type DataUseLimitationNoData = {
  code: GeneralResearchUseCode | HealthMedicalBiomedicalResearchCode | NoRestrictionCode | PopulationAncestryResearchOnlyCode;
  modifiers?: DataUseModifier[];
};

export type DataUseLimitationGeneralResearchUse = DataUseLimitationNoData;
export type DataUseLimitationHealthMedicalBiomedicalResearch = DataUseLimitationNoData;
export type DataUseLimitationNoRestriction = DataUseLimitationNoData;
export type DataUseLimitationPopulationAncestryResearchOnly = DataUseLimitationNoData;
export type DataUseLimitationDiseaseSpecific = {
  code: DiseaseSpecificResearchCode;
  disease: IOntology;
  modifiers?: DataUseModifier[];
};
export type DataUseLimitationFreeText = {
  code: undefined;
  description: string;
  modifiers: undefined;
};

export type DataUseLimitation = DataUseLimitationNoData | DataUseLimitationDiseaseSpecific | DataUseLimitationFreeText;
