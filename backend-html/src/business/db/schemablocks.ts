interface IOntology {
  id: string;
  label?: string;
}

type GeneralResearchUseCode = { id: 'DUO:0000042'; label: 'GRU' };
/**/ type HealthMedicalBiomedicalResearchCode = { id: 'DUO:0000006'; label: 'HMB' };
/**/ /**/ type DiseaseSpecificResearchCode = { id: 'DUO:0000007'; label: 'DS' };
/**/ type PopulationAncestryResearchOnlyCode = { id: 'DUO:0000011'; label: 'POA' };
type NoRestrictionCode = { id: 'DUO:0000004'; label: 'NRES' };

type PublicationRequiredCode = { id: 'DUO:0000019'; label: 'PUB' };
type SpecificUserCode = { id: 'DUO:0000026'; label: 'US' };
type CollaborationRequiredCode = { id: 'DUO:0000020'; label: 'COL' };
type NonCommercialUseOnlyCode = { id: 'DUO:0000046'; label: 'NCU' };
type NotForProfitNonCommercialUseOnlyCode = { id: 'DUO:0000018'; label: 'NPUNCU' };
type SpecificResearcherTypeCode = { id: 'DUO:0000006'; label: 'RS' };
type TimeLimitCode = { id: 'DUO:0000025'; label: 'TS' };
type NotForProfitUseOnlyCode = { id: 'DUO:0000045'; label: 'NPU' };
type PublicationMoratoriumCode = { id: 'DUO:0000024'; label: 'MOR' };
type GeneticStudiesOnlyCode = { id: 'DUO:0000016'; label: 'GSO' };
type ReturnToDatabaseCode = { id: 'DUO:0000029'; label: 'RTN' };
type ClinicalCareUseCode = { id: 'DUO:0000043'; label: 'CC' };
type NoGeneralMethodsCode = { id: 'DUO:0000015'; label: 'NMDS' };
type SpecificInstitutionCode = { id: 'DUO:0000028'; label: 'IS' };
type GeographicalRestrictionCode = { id: 'DUO:0000022'; label: 'GS' };
type SpecificProjectCode = { id: 'DUO:0000027'; label: 'PS' };

type DataUseModifierNoData = {
  code: PublicationRequiredCode | CollaborationRequiredCode | NonCommercialUseOnlyCode | NotForProfitNonCommercialUseOnlyCode;
};

type DataUseModifierTimeLimit = {
  code: TimeLimitCode;
  start: string;
  end: string;
};

type DataUseModifierGeographicalRestriction = {
  code: GeographicalRestrictionCode;
  allowed: string[];
};

type DataUseLimitationNoData = {
  term: GeneralResearchUseCode | HealthMedicalBiomedicalResearchCode | NoRestrictionCode | PopulationAncestryResearchOnlyCode;
  modifiers?: DataUseModifier[];
};

type DataUseLimitationDiseaseSpecific = {
  term: DiseaseSpecificResearchCode;
  disease: IOntology;
  modifiers?: DataUseModifier[];
};

type DataUseLimitationFreeText = {
  description: string;
};

type DataUseLimitation = DataUseLimitationNoData | DataUseLimitationDiseaseSpecific | DataUseLimitationFreeText;

type DataUseModifier = DataUseModifierNoData | DataUseModifierTimeLimit;

const perm: DataUseLimitation = { term: { id: 'DUO:0000042', label: 'GRU' } };

const perm2: DataUseLimitation = {
  term: { id: 'DUO:0000007', label: 'DS' },
  disease: { id: 'SNOMED:123312321', label: 'Diabetes' },
};
