import { Concept, ConceptDictionary } from "./concept-chooser-types";
import _ from "lodash";
import React, { Dispatch } from "react";

/**
 * A function to safely add concept searched results into our state.
 *
 * @param setSelected the React dispatch action for changing state
 * @param id the concept id to add
 * @param concept the concept data to add
 */
export function addToSelected(
  setSelected: Dispatch<React.SetStateAction<ConceptDictionary>>,
  id: string,
  concept: Concept
) {
  const permanentConcept = _.cloneDeep(concept);

  // our search process adds in some extra data to the concepts - which whilst not a massive problem - we
  // look to clean up before saving into the backend form data
  delete (permanentConcept as any)["hilighted"];
  delete (permanentConcept as any)["score"];

  setSelected((oldSelectedValue) => ({
    ...oldSelectedValue,
    [permanentConcept.id]: permanentConcept,
  }));
}

/**
 * A function to safely delete concepts from our state.
 *
 * @param setSelected the React dispatch action for changing state
 * @param id the concept id to delete
 */
export function removeFromSelected(
  setSelected: Dispatch<React.SetStateAction<ConceptDictionary>>,
  id: string
) {
  setSelected((oldSelected) => {
    const newSelected = { ...oldSelected };
    if (id in newSelected) delete newSelected[id];
    return newSelected;
  });
}
