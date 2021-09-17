import React from "react";
import { useHistory } from "react-router-dom";
import { ApplicationApiModel } from "../../../shared-src/api-models/application";

type ApplicationSummaryDivProps = {
  showFooter: boolean;
  application: ApplicationApiModel;
};

export const ApplicationSummaryDiv: React.FC<ApplicationSummaryDivProps> = ({
  showFooter,
  application,
}) => {
  const { push } = useHistory();

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* header */}
      <div className="px-4 py-4 flex justify-between">
        <span className="text-lg leading-6 font-medium text-gray-900">
          {application.projectTitle}
        </span>
        <span className="max-w-2xl text-sm text-gray-500">
          {application.state} / {application.id}
        </span>
      </div>
      {/*body*/}
      <div className="bg-gray-50 border-t border-gray-200">
        <dl className="space-y-4 px-4 py-4">
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">Applicant</dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {application.applicantDisplayName}
            </dd>
          </div>
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">PI</dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {application.principalInvestigatorDisplayName}
            </dd>
          </div>
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">Dataset Id</dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {application.datasetId}
            </dd>
          </div>
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">
              Research Use Statement
            </dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {application.researchUseStatement}
            </dd>
          </div>
        </dl>
      </div>
      {/* action footer */}
      {showFooter && (
        <div className="px-4 py-4 flex justify-end items-end space-x-4">
          <button
            className="btn-small btn-blue"
            onClick={() => push(`/p/application-edit/${application.id}`)}
          >
            Edit
          </button>
          <button
            className="btn-small btn-blue"
            onClick={() => push(`/p/application-timeline/${application.id}`)}
          >
            Timeline
          </button>
        </div>
      )}
    </div>
  );
};
