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
  applicationData: ApplicationApiModel;
  datasetData: DatasetApiModel;

  snomed: ConceptDictionary;
  setSnomed:  React.Dispatch<React.SetStateAction<ConceptDictionary>>;

  hgnc: ConceptDictionary;
  setHgnc: React.Dispatch<React.SetStateAction<ConceptDictionary>>;

  editEnabled: boolean;
  saveAction: () => void;
};

export const ApplicationEditDetailsSection: React.FC<Props> = ({
  applicationData,
  datasetData,
  snomed,
  setSnomed,
  hgnc,
  setHgnc,
  editEnabled,
  saveAction
}) => {
  return (
    <section className="shadow sm:rounded-md sm:overflow-hidden">
      <form action="#" method="POST">
        <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
          {/* data set id */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-3 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Dataset Id
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                {applicationData.datasetId} ({datasetData.name})
              </div>
            </div>
          </div>

          <LabelledContent label="Title (PI)">
            {applicationData.projectTitle} {applicationData.principalInvestigatorDisplayName}
          </LabelledContent>

          {/*
          <div>
            <label
              htmlFor="rus"
              className="block text-sm font-medium text-gray-700"
            >
              Research Use Statement
            </label>
            <div className="mt-1">
              <textarea
                id="rus"
                rows={5}
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
                value={applicationData.researchUseStatement}
                disabled={!editEnabled}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 opacity-75">
              A RUS is a brief description of the applicant’s proposed use of
              the dataset(s). The RUS will be reviewed by all parties
              responsible for data covered by this Data Access Request. Please
              note that if access is approved, you agree that the RUS, along
              with your name and institution, will be included on this website
              to describe your research project to the public. Please enter your
              RUS in the area below. The RUS should be one or two paragraphs in
              length and include research objectives, the study design, and an
              analysis plan (including the phenotypic characteristics that will
              be tested for association with genetic variants). If you are
              requesting multiple datasets, please describe how you will use
              them.
            </p>
          </div>*/}

          <div>
            <SnomedChooser
              selected={snomed}
              setSelected={setSnomed}
              disabled={!editEnabled}
            />
          </div>

          <div>
            <HgncChooser
              selected={hgnc}
              setSelected={setHgnc}
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
            type="submit"
            className={classnames("btn", "btn-blue", {
              "opacity-50": true,
              "cursor-not-allowed": true,
            })}
            disabled={true}
            onClick={saveAction}
          >
            Save
          </button>
        </div>
      </form>
    </section>
  );
};
