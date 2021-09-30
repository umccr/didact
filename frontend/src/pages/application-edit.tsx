import React, { useState } from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import classnames from "classnames";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { ApplicationApiModel } from "../../../shared-src/api-models/application";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import { SnomedChooser } from "../components/concept-chooser/snomed-chooser";
import { HgncChooser } from "../components/concept-chooser/hgnc-chooser";
import { Concept } from "../components/concept-chooser/concept";
import { DatasetApiModel } from "../../../shared-src/api-models/dataset";
import { ApplicationDataUseMatcher } from "../components/application-data-use-matcher";

export const APPLICATION_EDIT_QUERY_NAME = "application-edit";
export const APPLICATION_EDIT_DATASET_QUERY_NAME = "application-edit-ds";

export const ApplicationEditPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const queryClient = useQueryClient();

  const { createAxiosInstance } = React.useContext(
    UserLoggedInContext
  );

  const { data: applicationData } = useQuery<ApplicationApiModel>(
    [APPLICATION_EDIT_QUERY_NAME, applicationId],
    async ({ queryKey }) => {
      return await createAxiosInstance()
        .get<ApplicationApiModel>(`/api/application/${queryKey[1]}`)
        .then((response) => response.data);
    }
  );

  const datasetId = applicationData?.datasetId;

  const { isIdle, data: datasetData } = useQuery(
    [APPLICATION_EDIT_DATASET_QUERY_NAME, datasetId],
    async ({ queryKey }) => {
      return await createAxiosInstance()
        .get<DatasetApiModel>(`/api/dataset/${queryKey[1]}`)
        .then((response) => response.data);
    },
    {
      // the query will not execute until the datasetId exists/resolves
      enabled: !!applicationData,
    }
  );

  const submitClick = async () => {
    const apiResponse = await createAxiosInstance()
      .post<{}>(
        `/api/application/${applicationId}/submit`,
        {}
      )
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const [snomedSelected, setSnomedSelected] = useState(
    {} as { [id: string]: Concept }
  );

  const [hgncSelected, setHgncSelected] = useState(
    {} as { [id: string]: Concept }
  );

  const submitDisabled =
    applicationData &&
    ["submitted", "approved", "rejected"].includes(applicationData.state);
  const rusDisabled =
    applicationData &&
    ["submitted", "approved", "rejected"].includes(applicationData.state);
  const evaluateEnabled =
    applicationData && ["submitted", "approved", "rejected"].includes(applicationData.state);

  return (
    <LayoutStandardPage
      pageTitle="Edit Application"
      includeResearcherCommitteeChoice={false}
    >
      {applicationData && datasetData && (
        <div>
          <div className="md:grid md:grid-cols-6 md:gap-6">
            {/* left header column */}
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Data Access Request
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Details of the data requested.
                </p>
              </div>
            </div>

            {/* right content column */}
            <div className="mt-5 md:mt-0 md:col-span-5 md:space-y-6">
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {/* application id */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Application Id
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        {applicationData.id}
                      </div>
                    </div>
                  </div>

                  {/* application state */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Application State
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        {applicationData.state}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <div className="space-x-6">
                    <button
                      onClick={submitClick}
                      className={classnames("btn", "btn-blue", {
                        "opacity-50": submitDisabled,
                        "cursor-not-allowed": submitDisabled,
                      })}
                      disabled={submitDisabled}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </div>

              <form action="#" method="POST">
                <div className="shadow sm:rounded-md sm:overflow-hidden">
                  <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                    {/* data set id */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-3 sm:col-span-2">
                        <label
                          className="block text-sm font-medium text-gray-700"
                        >
                          Dataset Id
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          {applicationData.datasetId} ({datasetData.name})
                        </div>
                      </div>
                    </div>

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
                              "opacity-50": rusDisabled,
                            }
                          )}
                          value={applicationData.researchUseStatement}
                          disabled={rusDisabled}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 opacity-75">
                        A RUS is a brief description of the applicant’s proposed
                        use of the dataset(s). The RUS will be reviewed by all
                        parties responsible for data covered by this Data Access
                        Request. Please note that if access is approved, you
                        agree that the RUS, along with your name and
                        institution, will be included on this website to
                        describe your research project to the public. Please
                        enter your RUS in the area below. The RUS should be one
                        or two paragraphs in length and include research
                        objectives, the study design, and an analysis plan
                        (including the phenotypic characteristics that will be
                        tested for association with genetic variants). If you
                        are requesting multiple datasets, please describe how
                        you will use them.
                      </p>
                    </div>

                    <div>
                      <SnomedChooser
                        selected={snomedSelected}
                        setSelected={setSnomedSelected}
                      />
                    </div>

                    <div>
                      <HgncChooser
                        selected={hgncSelected}
                        setSelected={setHgncSelected}
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
                    >
                      Save
                    </button>
                  </div>
                </div>
              </form>

              {evaluateEnabled && (
                <ApplicationDataUseMatcher
                  applicationId={applicationData.id}
                  applicationState={applicationData.state}
                  dataUses={datasetData.dataUses}
                  subjects={datasetData.subjects!}
                  snomed={snomedSelected}
                  hgnc={hgncSelected}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </LayoutStandardPage>
  );
};
