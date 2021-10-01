import React from "react";
import classnames from "classnames";
import { useQuery, useQueryClient } from "react-query";
import { UserLoggedInContext } from "../../providers/user-logged-in-provider";
import { DatasetApiModel } from "../../../../shared-src/api-models/dataset";
import { ApplicationApiModel } from "../../../../shared-src/api-models/application";
import { PanelappPanelApiModel } from "../../../../shared-src/api-models/panelapp-panel";
import { LabelledContent } from "../../components/labelled-content";

type Props = {
  applicationData: ApplicationApiModel;
  datasetData: DatasetApiModel;
};

export const ApplicationEditReleaseSection: React.FC<Props> = ({
  applicationData,
  datasetData,
}) => {
  const queryClient = useQueryClient();

  const { createAxiosInstance } = React.useContext(UserLoggedInContext);

  return (
    <section className="shadow sm:rounded-md sm:overflow-hidden">
      <div className="px-4 py-3 bg-green-200 text-left sm:px-6">
        <label className="block text-sm font-medium text-gray-700">
          Released Data
        </label>
      </div>

      <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
        {applicationData.release && applicationData.release.panelappId && (
          <LabelledContent label="PanelApp Restrictions">
            <p>
              {applicationData.release?.panelappId} (
              {applicationData.release?.panelappVersion})
            </p>
          </LabelledContent>
        )}

        <LabelledContent label="Endpoints">
          {applicationData.release &&
            applicationData.release.htsgetEndpoint &&
            (applicationData.release.variantsEnabled ||
              applicationData.release.readsEnabled) && (
              <p>
                <span className="font-mono font-bold">htsget</span>{" "}
                {applicationData.release?.htsgetEndpoint} for
                {applicationData.release.variantsEnabled && (
                  <span>variants</span>
                )}
                {applicationData.release.readsEnabled && <span>reads</span>}
              </p>
            )}
          {applicationData.release &&
            applicationData.release.fhirEndpoint &&
            applicationData.release.phenotypesEnabled && (
              <p>
                <span className="font-mono font-bold">fhir</span>{" "}
                {applicationData.release?.fhirEndpoint}
              </p>
            )}
        </LabelledContent>

        <LabelledContent label="Subjects">
          {applicationData.release &&
            applicationData.release.subjects.map((r) => (
              <p key={r.subjectId}>
                {r.subjectId} for {JSON.stringify(r.sampleIds)}
              </p>
            ))}
        </LabelledContent>
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <div className="space-x-6">
          <button
            onClick={() => {}}
            className={classnames("btn", "btn-red", {
              "opacity-50": false,
              "cursor-not-allowed": false,
            })}
          >
            End Application Data Use
          </button>
        </div>
      </div>
    </section>
  );
};
