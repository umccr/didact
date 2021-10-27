import { ConceptDictionary } from "../../components/concept-chooser/concept-chooser-types";
import axios from "axios";
import React from "react";

/**
 * When restoring the application UI from saved state - we need to refresh the descriptions
 * of all the codes as we only store the codes in the backend.
 *
 * @param snomed
 * @param setSnomed
 * @param hgnc
 * @param setHgnc
 */
export async function lookupConceptDictionaries(
  snomed: string[],
  setSnomed: React.Dispatch<React.SetStateAction<ConceptDictionary>>,
  hgnc: string[],
  setHgnc: React.Dispatch<React.SetStateAction<ConceptDictionary>>
) {
  setSnomed(
    await doLookup(
      "https://r4.ontoserver.csiro.au/fhir",
      "http://snomed.info/sct",
      snomed
    )
  );
  setHgnc(
    await doLookup(
      "https://genomics.ontoserver.csiro.au/fhir",
      "http://www.genenames.org",
      hgnc
    )
  );
}

/**
 * Do a batch lookup at a single Ontoserver endpoint for a single 'system' of codes -
 * and return a concept dictionary with all the descriptions of the code.
 *
 * @param uri
 * @param system
 * @param codes
 */
async function doLookup(
  uri: string,
  system: string,
  codes: string[]
): Promise<ConceptDictionary> {

  const dictionaryResult: ConceptDictionary = {};

  if (!codes)
    return dictionaryResult;

  if (codes.length === 0)
    return dictionaryResult;

  const bundle = {
    type: "batch",
    resourceType: "Bundle",
    entry: [] as any[],
  };

  for (const c of codes) {
    bundle.entry.push({
      request: {
        method: "POST",
        url: "CodeSystem/$lookup",
      },
      resource: {
        resourceType: "Parameters",
        parameter: [
          {
            valueUri: system,
            name: "system",
          },
          {
            valueCode: c,
            name: "code",
          },
        ],
      },
    });
  }

  const results = await axios
    .post(uri, bundle, {
      headers: {
        "Content-Type": "application/fhir+json",
        Accept: "application/fhir+json",
      },
    })
    .then((res) => res.data);

  // the results array will come back with equivalence to the codes we sent
  // in - so we use an index to help us jump across to the codes
  let entryCount = 0;

  for (const entry of results?.entry || []) {
    if (entry?.response?.status === "200") {
      for (const param of entry?.resource?.parameter || []) {
        if (param?.name === "display")
          dictionaryResult[codes[entryCount]] = { id: codes[entryCount], name: param?.valueString };
      }
    } else {
      console.log(
        `Dropping code ${codes[entryCount]} as the lookup of it resulted in ${entry?.response}`
      );
    }
    entryCount++;
  }

  return dictionaryResult;
}
