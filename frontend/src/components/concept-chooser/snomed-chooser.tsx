import { Concept } from "./concept";
import React, { Dispatch, useState } from "react";
import { ConceptChooser } from "./concept-chooser";
import _ from "lodash";

type Props = {
  // the dictionary of currently selected concepts to be held in suitable state somewhere else
  selected: { [id: string]: Concept };

  setSelected: Dispatch<React.SetStateAction<{ [id: string]: Concept }>>
};

/**
 * @param props
 * @constructor
 */
export const SnomedChooser: React.FC<Props> = ({ selected, setSelected }) => {
  const addToSnomedSelected = (id: string, concept: Concept) => {
    const permanentConcept = _.cloneDeep(concept);

    // our search process adds in some extra data to the concepts - which whilst not a massive problem - we
    // look to clean up before saving into the backend form data
    delete (permanentConcept as any)["hilighted"];
    delete (permanentConcept as any)["score"];

    setSelected((oldSelectedValue) => ({
      ...oldSelectedValue,
      [permanentConcept.id]: permanentConcept,
    }));
  };

  const removeFromSnomedSelected = (id: string) => {
    const newSelected = { ...selected };
    if (id in newSelected) delete newSelected[id];

    setSelected(newSelected);
  };

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
      addToSelected={addToSnomedSelected}
      removeFromSelected={removeFromSnomedSelected}
    />
  );
};
