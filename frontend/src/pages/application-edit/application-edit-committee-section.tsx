import { DataUseLimitation } from "../../../../shared-src/api-models/data-use-limitation";
import React, { useState } from "react";
import classnames from "classnames";
import axios from "axios";
import { APPLICATION_EDIT_QUERY_NAME } from "./application-edit";
import { useQuery, useQueryClient } from "react-query";
import { UserLoggedInContext } from "../../providers/user-logged-in-provider";
import { DataUseTable } from "../../components/data-use-table";
import { DatasetApiSubjectModel } from "../../../../shared-src/api-models/dataset";
import { SubjectsTable } from "../../components/subjects-table";
import {
  ApplicationApiModel,
  ApplicationApproveApiModel,
} from "../../../../shared-src/api-models/application";
import { PanelappPanelApiModel } from "../../../../shared-src/api-models/panelapp-panel";
import { Concept } from "../../components/concept-chooser/concept-chooser-types";
import { LabelledContent } from "../../components/labelled-content";

type Props = {
  applicationData: ApplicationApiModel;

  subjects: { [id: string]: DatasetApiSubjectModel };

  snomed: { [id: string]: Concept };
  hgnc: { [id: string]: Concept };

  dataUses: DataUseLimitation[];
};

type Evaluation = {
  overallPasses: boolean[];

  subjectPasses: { [id: string]: boolean }
};

export const ApplicationEditCommitteeSection: React.FC<Props> = ({
  applicationData,
  subjects,
  snomed,
  hgnc,
  dataUses,
}) => {
  const queryClient = useQueryClient();

  const { createAxiosInstance } = React.useContext(UserLoggedInContext);

  const { data: panelappData } = useQuery<PanelappPanelApiModel[]>(
    "panelapp",
    async () => {
      return await createAxiosInstance()
        .get<PanelappPanelApiModel[]>(`/api/reference-data/panels`)
        .then((response) => response.data);
    }
  );

  const unapproveClick = async () => {
    await createAxiosInstance()
      .post<{}>(`/api/application/${applicationData.id}/unapprove`, {})
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const approveDisabled = ["started", "approved"].includes(
    applicationData.state
  );
  const unapproveDisabled = ["submitted", "started"].includes(
    applicationData.state
  );

  const [phenotypesEnabled, setPhenotypesEnabled] = useState<boolean>(false);
  const [variantsEnabled, setVariantsEnabled] = useState<boolean>(false);
  const [readsEnabled, setReadsEnabled] = useState<boolean>(false);
  const [subjectsSelected, setSubjectsSelected] = useState<Set<string>>(
    new Set([])
  );
  const [panelSelected, setPanelSelected] = useState<string>("");
  const [panelMin, setPanelMin] = useState<string>("3");

  const approveClick = async () => {
    const approveDetails: ApplicationApproveApiModel = {
      readsEnabled: readsEnabled,
      variantsEnabled: variantsEnabled,
      phenotypesEnabled: phenotypesEnabled,
      subjectIds: Array.from(subjectsSelected),
    };

    if (panelappData && panelSelected) {
      const sel = panelappData.find((a) => a.id == panelSelected);
      console.log(sel);

      if (sel) {
        approveDetails.panelappId = parseInt(sel.id);
        approveDetails.panelappVersion = sel.version;
        approveDetails.panelappMinConfidence = parseInt(panelMin);

      }
    }

    await createAxiosInstance()
      .post<ApplicationApproveApiModel>(
        `/api/application/${applicationData.id}/approve`, approveDetails
      )
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const [evaluateState, setEvaluateState] = useState<Evaluation>({ overallPasses: [], subjectPasses: {}});

  const evaluateDataUse = async (du: DataUseLimitation): Promise<boolean> => {
    //console.log(`Evaluating ${JSON.stringify(du)}`);
    //const messages: string[] = [];

    // we know how to check disease state
    if (du.code?.id === "DUO:0000007") {
      const ds = (du as any).disease.id;
      if (ds.startsWith("SNOMED:")) {
        const datasetSnomed = ds.substr(7);

        for (const entry of Object.entries(snomed)) {
          const applicationSnomed = entry[1].id;
          //const applicationSnomedName = entry[1].name;
          const ontoResult = await axios
            .get<any>(
              `https://r4.ontoserver.csiro.au/fhir/CodeSystem/$subsumes?system=http://snomed.info/sct&codeA=${datasetSnomed}&codeB=${applicationSnomed}`
            );

            for (const r of ontoResult.data?.parameter || []) {
              if (r?.name === "outcome") {
                if (r?.valueCode === "subsumes")
                  return true;
              }
            }
        }
      }
    }

    return false;
  }

  const evaluateClick = async () => {
    const newEvaluateState: Evaluation = { overallPasses: [], subjectPasses: {}};

    let all = true;
    let index = 0;
    for (const du of dataUses) {
      const duResult = await evaluateDataUse(du);
      newEvaluateState.overallPasses[index] = duResult;
      if (!duResult)
        all = false;
      index++;
    }

    // only if all the dataset usages passes do we bother with the subject levels
    if (all) {
      const passes = new Set<string>([]);

      for (const [id, subject] of Object.entries(subjects)) {
        if (subject.dataUse) {
          const subjectDuResult = await evaluateDataUse(subject.dataUse);
          newEvaluateState.subjectPasses[id] = subjectDuResult;
          if (subjectDuResult)
            passes.add(id);
        }
        else {
          passes.add(id);

        }
      }

      setSubjectsSelected(passes);
    }

    setEvaluateState(newEvaluateState);
  };

  return (
    <section className="shadow sm:rounded-md sm:overflow-hidden">
      <div className="px-4 py-3 bg-red-100 text-left sm:px-6">
        <label className="block text-sm font-medium text-gray-700">
          Committee Use Only
        </label>
      </div>

      <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
        {applicationData.release && (
          <p>
            This application has been approved for use with the above details.
          </p>
        )}

        {!applicationData.release && (
          <>
            <LabelledContent label="Dataset Usage Evaluator">
              <div className="px-8 space-y-4">
              <p>
                Application will be evaluated against overall data set restrictions and individual subject restrictions (NOTE: Only DS is currently evaluated)
              </p>
              <ul className="list-disc">
                {Object.values(snomed).map((concept) => <li>{concept.name}</li>)}
              </ul>
              <button
                onClick={evaluateClick}
                className={classnames("btn", "btn-blue", "w-32")}
              >
                Evaluate
              </button>
              <hr/>
              </div>
              {/*{evaluateState && evaluateState.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mt-2">
                  {dataUses.map((du, index) => (
                    <>
                      <div key={index} className="col-span-1">
                        Evaluating against DUO <br />
                        <DataUseTable dataUse={du} showChecked={true} />
                      </div>
                      <div className="col-span-2">
                        {evaluateState[index].messages.map((msg) => (
                          <p>{msg}</p>
                        ))}
                      </div>
                    </>
                  ))}
                </div>
              )} */}
            </LabelledContent>

            <LabelledContent label="Dataset Usage Restrictions">
              <div className="space-y-4 w-1/2">
                {dataUses.map((du, index) => (
                  <DataUseTable key={index} dataUse={du} showChecked={true} checked={evaluateState.overallPasses[index]} />
                ))}
              </div>
            </LabelledContent>

            <LabelledContent label="Subject Restrictions">
              <SubjectsTable
                subjects={subjects}
                subjectPasses={evaluateState.subjectPasses}
                selected={subjectsSelected}
                setSelected={setSubjectsSelected}
              />
            </LabelledContent>

            <LabelledContent label="Data Type Restrictions">
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={phenotypesEnabled}
                    onChange={() => setPhenotypesEnabled(!phenotypesEnabled)}
                  />
                  <span className="ml-2">Phenotypes</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    disabled
                    checked={readsEnabled}
                    onChange={() => setReadsEnabled(!readsEnabled)}
                  />
                  <span className="ml-2">Reads</span>
                </label>
              </div>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={variantsEnabled}
                    onChange={() => setVariantsEnabled(!variantsEnabled)}
                  />
                  <span className="ml-2">Variants</span>
                </label>
              </div>
            </LabelledContent>

            <LabelledContent label="Genomic Region Restrictions">
              <div>
                <p>
                  NOTE: enabling any restriction on genomic region will disable
                  access to fastq files (or any other sources of raw read data).
                </p>
              </div>
              <select className="form-select block w-full mt-1 p-2 border-gray-400 border" value={panelSelected}
                      onChange={(e) => setPanelSelected(e.target.value)} >
                <option value={""}>-- none --</option>
                {panelappData &&
                  panelappData.map((p, index) => (
                    <option key={index} value={p.id}>
                      {p.name} {p.version}
                    </option>
                  ))}
              </select>
              <div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="panelMin"
                      value="1"
                      checked={panelMin === "1"}
                      onClick={() => setPanelMin("1")}
                    />
                    <span className="ml-2">Red Genes</span>
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="panelMin"
                      checked={panelMin === "2"}
                      onClick={() => setPanelMin("2")}
                    />
                    <span className="ml-2">Yellow Genes</span>
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="panelMin"
                      checked={panelMin === "3"}
                      onClick={() => setPanelMin("3")}
                    />
                    <span className="ml-2">Green Genes</span>
                  </label>
                </div>
              </div>
            </LabelledContent>

            <LabelledContent label="Cloud Restrictions">
              <div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="cloudRegion"
                      value="1"
                      checked
                    />
                    <span className="ml-2">AWS Sydney</span>
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="cloudRegion"
                      disabled={true}
                    />
                    <span className="ml-2">Google Sydney</span>
                  </label>
                </div>
              </div>
            </LabelledContent>

          </>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <div className="space-x-6">
          <button
            onClick={approveClick}
            className={classnames("btn", "btn-blue", {
              "opacity-50": approveDisabled,
              "cursor-not-allowed": approveDisabled,
            })}
            disabled={approveDisabled}
          >
            Approve
          </button>

          <button
            onClick={unapproveClick}
            className={classnames("btn", "btn-blue", {
              "opacity-50": unapproveDisabled,
              "cursor-not-allowed": unapproveDisabled,
            })}
            disabled={unapproveDisabled}
          >
            Unapprove
          </button>
        </div>
      </div>
    </section>
  );
};
