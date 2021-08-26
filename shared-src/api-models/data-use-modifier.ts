import { IOntology } from "./_data-use.interface";

type PublicationRequiredCode = { id: "DUO:0000019"; label: "PUB" };
type CollaborationRequiredCode = { id: "DUO:0000020"; label: "COL" };
type NonCommercialUseOnlyCode = { id: "DUO:0000046"; label: "NCU" };
type NotForProfitNonCommercialUseOnlyCode = {
  id: "DUO:0000018";
  label: "NPUNCU";
};
type TimeLimitCode = { id: "DUO:0000025"; label: "TS" };
type NotForProfitUseOnlyCode = { id: "DUO:0000045"; label: "NPU" };
type PublicationMoratoriumCode = { id: "DUO:0000024"; label: "MOR" };
type GeneticStudiesOnlyCode = { id: "DUO:0000016"; label: "GSO" };
type ReturnToDatabaseCode = { id: "DUO:0000029"; label: "RTN" };
type ClinicalCareUseCode = { id: "DUO:0000043"; label: "CC" };
type NoGeneralMethodsCode = { id: "DUO:0000015"; label: "NMDS" };
type GeographicalRestrictionCode = { id: "DUO:0000022"; label: "GS" };
type SpecificUserCode = { id: "DUO:0000026"; label: "US" };
type SpecificResearcherTypeCode = { id: "DUO:0000006"; label: "RS" };
type SpecificInstitutionCode = { id: "DUO:0000028"; label: "IS" };
type SpecificProjectCode = { id: "DUO:0000027"; label: "PS" };

export type DataUseModifierNoData = {
  code:
    | PublicationRequiredCode
    | CollaborationRequiredCode
    | NonCommercialUseOnlyCode
    | NotForProfitNonCommercialUseOnlyCode
    | NotForProfitUseOnlyCode
    | GeneticStudiesOnlyCode
    | ReturnToDatabaseCode
    | NoGeneralMethodsCode
    | ClinicalCareUseCode;
};

export type DataUseModifierTimeLimit = {
  code: TimeLimitCode;
  start?: string;
  end?: string;
};

export type DataUseModifierPublicationMoratorium = {
  code: PublicationMoratoriumCode;
  start?: string;
  end?: string;
};

export type DataUseModifierGeographicalRestriction = {
  code: GeographicalRestrictionCode;
  allowed: string[];
};

export type DataUseModifierSpecificUser = {
  code: SpecificUserCode;
  users: IOntology[];
};

export type DataUseModifierSpecificResearcherType = {
  code: SpecificResearcherTypeCode;
  types: IOntology[];
};

export type DataUseModifierSpecificInstitution = {
  code: SpecificInstitutionCode;
  institutes: IOntology[];
};

export type DataUseModifierSpecificProject = {
  code: SpecificProjectCode;
  projects: IOntology[];
};

export type DataUseModifier =
  | DataUseModifierNoData
  | DataUseModifierTimeLimit
  | DataUseModifierPublicationMoratorium
  | DataUseModifierGeographicalRestriction
  | DataUseModifierSpecificUser
  | DataUseModifierSpecificResearcherType
  | DataUseModifierSpecificInstitution
  | DataUseModifierSpecificProject;
