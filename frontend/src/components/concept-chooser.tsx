import React, { useState } from "react";
import { useCombobox } from "downshift";
import axios from "axios";
import classNames from "classnames";
import _ from "lodash";

export type Concept = {
  id: string;
  name: string;
};

type Props = {
  ontoServerUrl: string; // "https://genomics.ontoserver.csiro.au

  systemUri: string; // "http://purl.obolibrary.org/obo/hp.owl"
  systemVersion: string; // "20191108"
  rootConceptId: string; // "HP:0000118"

  label: string;
  codePrefix: string;
  placeholder: string;

  // the dictionary of currently selected concepts
  selected: { [id: string]: Concept };

  addToSelected(id: string, concept: Concept): void;

  removeFromSelected(id: string): void;
};

/**
 * A dropdown box (with persistent list of 'selected' items) - that browses a FHIR based
 * ontology server for concepts.
 *
 * @param props
 * @constructor
 */
export const ConceptChooser: React.FC<Props> = (props: Props) => {
  const [searchHits, setSearchHits] = useState([] as Concept[]);

  const stateReducer = (state: any, actionAndChanges: any) => {
    const { type, changes } = actionAndChanges;
    switch (type) {
      case useCombobox.stateChangeTypes.ItemClick:
      case useCombobox.stateChangeTypes.InputKeyDownEnter:
        return {
          // blank out the input after selection
          ...changes,
          inputValue: "",
        };
      case useCombobox.stateChangeTypes.InputChange:
      case useCombobox.stateChangeTypes.InputBlur:
      default:
        // otherwise business as usual
        return changes;
    }
  };

  const {
    isOpen,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
  } = useCombobox({
    items: searchHits,
    stateReducer,
    itemToString: (item) => item?.name || "",
    onInputValueChange: ({ inputValue }) => {
      if (inputValue) fetchConceptSearch(inputValue);
    },
    onSelectedItemChange: (item) => {
      if (item.selectedItem) {
        props.addToSelected(item.selectedItem.id, item.selectedItem);
      }
    },
  });

  /**
   * Search the ontology server for given query text.
   *
   * @param query
   */
  const fetchConceptSearch = (query: string) => {
    if (!query || query.length < 3) {
      setSearchHits([]);
      return;
    }

    /* OLD WAY IF WE WERE ALLOWED POSTS
      const searchBody = {

      resourceType: "Parameters",
      parameter: [
        { name: "filter", valueString: query },
        {
          name: "valueSet",
          resource: {
            resourceType: "ValueSet",
            status: "active",
            compose: {
              include: [
                {
                  system: props.systemUri,
                  version: props.systemVersion,
                  //                  filter: [
                  //                    {
                  //                     property: "concept",
                  //                    op: "is-a",
                  //                    value: props.rootConceptId,
                  //                  },
                  //                ],
                },
              ],
            },
          },
        },
      ],
    }; */
    // _format: json
    // url: http://snomed.info/sct/32506021000036107/version/20210731?fhir_vs=refset/32570581000036105
    // filter: atax
    // system-version: http://snomed.info/sct|http://snomed.info/sct/32506021000036107/version/20210731
    // includeDesignations: true
    // count: 100
    // elements: expansion.contains.code,expansion.contains.display,expansion.contains.fullySpecifiedName,expansion.contains.active

    axios
      .get(`${props.ontoServerUrl}/ValueSet/$expand`, {
        params: {
          _format: "json",
          filter: query,
          url: props.systemUri,
          "system-version": props.systemVersion,
          includeDesignations: true,
          count: 100,
          elements:
            "expansion.contains.code,expansion.contains.display,expansion.contains.fullySpecifiedName,expansion.contains.active",
        },
        headers: {
          "Content-Type": "application/fhir+json",
        },
      })
      .then((response) => {
        if (_.isArray(response.data.expansion.contains))
          setSearchHits(
            response.data.expansion.contains.map((ontoResult: any) => {
              return {
                id: ontoResult.code,
                name: ontoResult.display,
              };
            })
          );
      });
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-x-6">
        <div className="col-span-6">
          <label
            {...getLabelProps()}
            className="block text-sm font-medium text-gray-700"
          >
            {props.label}
          </label>
        </div>
        <div className="col-span-6 sm:col-span-3">
          <div>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {props.codePrefix}
                </span>
              </div>
              <input
                type="text"
                {...getInputProps({
                  placeholder: props.placeholder,
                })}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-28 pr-12 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
            {/* if the input element is open, render the div else render nothing*/}
            {isOpen && searchHits && searchHits.length > 0 && (
              <div
                className="absolute z-10 mt-2 w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabIndex={-1}
                {...getMenuProps()}
              >
                <div className="py-1" role="none">
                  {searchHits.slice(0, 10).map((item: any, index: number) => {
                    const itemProps = getItemProps({
                      key: index,
                      index,
                      item,
                    });

                    const classn = classNames(
                      {
                        "bg-gray-100": highlightedIndex === index,
                        "text-gray-900": highlightedIndex === index,
                        "text-gray-700": highlightedIndex !== index,
                      },
                      "block",
                      "px-4",
                      "py-2",
                      "text-sm"
                    );

                    return (
                      <div
                        className={classn}
                        role="menuitem"
                        tabIndex={-1}
                        key={itemProps.key}
                        {...itemProps}
                      >
                        <span className="mr-6" />
                        {item.name}
                      </div>
                    );
                  })}
                  {searchHits.length > 10 && (
                    <div
                      className="block px-4 py-2 text-sm"
                      role="menuitem"
                      tabIndex={-1}
                    >
                      ...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="col-span-6 sm:col-span-3">
          {!_.isEmpty(props.selected) && (
            <div className="flex flex-col">
              <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                  <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Object.entries(props.selected).map(
                          ([_, panel], index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {panel.name}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="hover:text-indigo-900 text-red-500"
                                  onClick={() =>
                                    props.removeFromSelected(panel.id)
                                  }
                                >
                                  x
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
