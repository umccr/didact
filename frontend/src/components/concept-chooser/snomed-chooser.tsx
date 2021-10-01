import React, { Dispatch } from "react";
import { ConceptDictionary } from "./concept-chooser-types";
import { ConceptChooser } from "./concept-chooser";
import { addToSelected, removeFromSelected } from "./concept-chooser-utils";

type Props = {
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: ConceptDictionary;

  setSelected: Dispatch<React.SetStateAction<ConceptDictionary>>;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const SnomedChooser: React.FC<Props> = ({ selected, setSelected, disabled }) => {
  return (
    <ConceptChooser
      ontoServerUrl="https://r4.ontoserver.csiro.au/fhir"
      systemUri="http://snomed.info/sct/32506021000036107/version/20210731?fhir_vs=refset/32570581000036105"
      systemVersion="http://snomed.info/sct|http://snomed.info/sct/32506021000036107/version/20210731"
      rootConceptId="HP:0000118"
      label="Disease Specific Study of Condition(s)"
      placeholder="e.g. ataxia, hypoplasia"
      codePrefix="SNOMED"
      selected={selected}
      disabled={disabled}
      addToSelected={(a,b) => addToSelected(setSelected, a, b)}
      removeFromSelected={(a) => removeFromSelected(setSelected, a)}
    />
  );
};
