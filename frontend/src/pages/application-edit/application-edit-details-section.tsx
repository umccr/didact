import React from "react";
import classnames from "classnames";
import { SnomedChooser } from "../../components/concept-chooser/snomed-chooser";
import { HgncChooser } from "../../components/concept-chooser/hgnc-chooser";
import { DatasetApiModel, DatasetApiSubjectModel } from "../../../../shared-src/api-models/dataset";
import { DataUseLimitation } from "../../../../shared-src/api-models/data-use-limitation";
import { ApplicationApiModel } from "../../../../shared-src/api-models/application";
import { ConceptDictionary } from "../../components/concept-chooser/concept-chooser-types";
import { LabelledContent } from "../../components/labelled-content";

type Props = {
  // master control that either enables overall editing or not.. will be based on
  // overall application state
  editEnabled: boolean;

  applicationData: ApplicationApiModel;
  datasetData: DatasetApiModel;

  snomed: ConceptDictionary;
  setSnomed:  React.Dispatch<React.SetStateAction<ConceptDictionary>>;

  hgnc: ConceptDictionary;
  setHgnc: React.Dispatch<React.SetStateAction<ConceptDictionary>>;

  rus: string;
  setRus: React.Dispatch<React.SetStateAction<string>>;

  // true if the editable state has been changed since last save i.e. would saveAction() do anything..
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;

  saveAction: () => void;
};

export const ApplicationEditDetailsSection: React.FC<Props> = ({
  applicationData,
  datasetData,
  snomed,
  setSnomed,
  hgnc,
  setHgnc,
  rus,
  setRus,
  editEnabled,
  isDirty,
  setIsDirty,
  saveAction
}) => {
  return (
    <section className="shadow sm:rounded-md sm:overflow-hidden">
        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
          <LabelledContent label="Dataset Id (Name)">
            {applicationData.datasetId} ({datasetData.name})
          </LabelledContent>

          <LabelledContent label="Title (PI)">
            {applicationData.projectTitle} ({applicationData.principalInvestigatorDisplayName})
          </LabelledContent>

          <LabelledContent label="Research Use Statement">
            <>
              <textarea
                id="rus"
                rows={3}
                className={classnames(
                  "shadow-sm",
                  "focus:ring-indigo-500",
                  "focus:border-indigo-500",
                  "mt-1",
                  "block",
                  "w-full",
                  "sm:text-sm",
                  "border",
                  "border-gray-300",
                  "rounded-md",
                  {
                    "opacity-50": !editEnabled,
                  }
                )}
                value={rus}
                disabled={!editEnabled}
                onChange={(e) => { setRus(e.target.value); setIsDirty(true); } }
              />
              <p className="mt-2 text-sm text-gray-500 opacity-75">
                A RUS is a brief description of the applicant’s proposed use of
                the dataset(s). The RUS will be reviewed by all parties
                responsible for data covered by this Data Access Request.
              </p>
            </>
          </LabelledContent>

          <div>
            <SnomedChooser
              selected={snomed}
              setSelected={setSnomed}
              setIsDirty={setIsDirty}
              disabled={!editEnabled}
            />
          </div>

          <div>
            <HgncChooser
              selected={hgnc}
              setSelected={setHgnc}
              setIsDirty={setIsDirty}
              disabled={!editEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Approved Study Ethics
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      disabled={!editEnabled}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF up to 1MB</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <button
            className={classnames("btn", {
              "btn-blue" : !isDirty,
              "btn-red" : isDirty,
              "opacity-50": !editEnabled,
              "cursor-not-allowed": !editEnabled,
            })}
            disabled={!editEnabled}
            onClick={() => { if (isDirty) saveAction(); }}
          >
            Save
          </button>
        </div>
    </section>
  );
};
