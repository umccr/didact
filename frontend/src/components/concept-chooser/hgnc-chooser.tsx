import { Concept, ConceptDictionary } from "./concept-chooser-types";
import React, { Dispatch } from "react";
import { ConceptChooser } from "./concept-chooser";
import { addToSelected, removeFromSelected } from "./concept-chooser-utils";

type Props = {
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: ConceptDictionary;

  // the action to mutate concept state
  setSelected: Dispatch<React.SetStateAction<ConceptDictionary>>

  setIsDirty: Dispatch<React.SetStateAction<boolean>>;

  disabled: boolean;
};

/**
 * @param props
 * @constructor
 */
export const HgncChooser: React.FC<Props> = ({ selected, setSelected, setIsDirty, disabled }) => {
  return (
    <ConceptChooser
      ontoServerUrl="https://r4.ontoserver.csiro.au/fhir"
      systemUri="http://www.genenames.org/geneId"
      systemVersion="http://www.genenames.org/geneId|2021-10-04"
      rootConceptId="xxx"
      label="Gene Specific Study"
      placeholder="e.g. SHOX2, AATF"
      codePrefix="HGNC"
      selected={selected}
      disabled={disabled}
      addToSelected={(a,b) => { addToSelected(setSelected, a, b); setIsDirty(true); } }
      removeFromSelected={(a) => { removeFromSelected(setSelected, a); setIsDirty(true); } }
    />
  );
};
