import React, { useState } from "react";
import { LayoutStandardPage } from "../../layouts/layout-standard-page";
import classnames from "classnames";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
import axios from "axios";
import { ApplicationApiModel } from "../../../../shared-src/api-models/application";
import { UserLoggedInContext } from "../../providers/user-logged-in-provider";
import { SnomedChooser } from "../../components/concept-chooser/snomed-chooser";
import { HgncChooser } from "../../components/concept-chooser/hgnc-chooser";
import { DatasetApiModel } from "../../../../shared-src/api-models/dataset";
import { ApplicationEditCommitteeSection } from "./application-edit-committee-section";
import { ApplicationEditDetailsSection } from "./application-edit-details-section";
import { ConceptDictionary } from "../../components/concept-chooser/concept-chooser-types";
import { lookupConceptDictionaries } from "./application-edit-utils";
import { ApplicationEditReleaseSection } from "./application-edit-release-section";
import { LabelledContent } from "../../components/labelled-content";

export const APPLICATION_EDIT_QUERY_NAME = "application-edit";
export const APPLICATION_EDIT_DATASET_QUERY_NAME = "application-edit-ds";

export const ApplicationEditPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const queryClient = useQueryClient();

  const { createAxiosInstance } = React.useContext(UserLoggedInContext);

  // the state of these is maintained mainly locally - but when we do a full refresh
  // of the application state from the backend - there is also a sideeffect that these
  // are rehydrated from a plain list of codes
  const [snomedSelected, setSnomedSelected] = useState<ConceptDictionary>({});
  const [hgncSelected, setHgncSelected] = useState<ConceptDictionary>({});

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
      // this is not technically correct.. not sure where we should do this.. but we want to set the
      // initial state of the concept choosers - but because we don't actually save yet we only want to
      // do it once.. so this is a spot that only executes once
      if (applicationData)
        await lookupConceptDictionaries(
          applicationData.snomed || [],
          setSnomedSelected,
          applicationData.hgnc || [],
          setHgncSelected
        );

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
    await createAxiosInstance()
      .post<{}>(`/api/application/${applicationId}/submit`, {})
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const submitDisabled =
    applicationData &&
    ["submitted", "approved", "rejected"].includes(applicationData.state);

  const applicationEditDisabled =
    applicationData &&
    ["submitted", "approved", "rejected"].includes(applicationData.state);

  const evaluateEnabled =
    applicationData &&
    ["submitted", "approved", "rejected"].includes(applicationData.state);

  const releaseSectionVisible =
    applicationData && ["approved"].includes(applicationData.state);

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
              <section className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  <LabelledContent label="Application Id">
                    {applicationData.id}
                  </LabelledContent>

                  <LabelledContent label="Application State">
                    {applicationData.state}
                  </LabelledContent>
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
              </section>

              <ApplicationEditDetailsSection
                applicationData={applicationData}
                datasetData={datasetData}
                snomed={snomedSelected}
                setSnomed={setSnomedSelected}
                hgnc={hgncSelected}
                setHgnc={setHgncSelected}
                editEnabled={!submitDisabled}
                saveAction={() => {}}
              />

              {releaseSectionVisible && (
                <ApplicationEditReleaseSection
                  applicationData={applicationData}
                  datasetData={datasetData}
                />
              )}

              {evaluateEnabled && (
                <ApplicationEditCommitteeSection
                  applicationData={applicationData}
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
