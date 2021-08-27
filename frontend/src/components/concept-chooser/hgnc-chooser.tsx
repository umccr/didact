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
export const HgncChooser: React.FC<Props> = ({ selected, setSelected }) => {
  const addToHgncSelected = (id: string, concept: Concept) => {
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

  const removeFromHgncSelected = (id: string) => {
    const newSelected = { ...selected };
    if (id in newSelected) delete newSelected[id];

    setSelected(newSelected);
  };

  return (
    <ConceptChooser
      ontoServerUrl="https://genomics.ontoserver.csiro.au/fhir"
      systemUri="http://www.genenames.org"
      systemVersion="http://www.genenames.org|20100712"
      rootConceptId="HP:0000118"
      label="Gene Specific Study"
      placeholder="e.g. SHOX2, AATF"
      codePrefix="HGNC"
      selected={selected}
      addToSelected={addToHgncSelected}
      removeFromSelected={removeFromHgncSelected}
    />
  );
};
