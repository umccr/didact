import React, { useContext } from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { useQuery } from "react-query";
import { DatasetApiModel } from "../../../shared-src/api-models/dataset";
import { DataUseTable } from "../components/data-use-table";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import { ClipLoader } from "react-spinners";

type DatasetDivProps = {
  dataset: DatasetApiModel;
};

const DatasetDiv: React.FC<DatasetDivProps> = ({ dataset }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {/* header */}
      <div className="px-4 py-4 flex justify-between">
        <span className="text-lg leading-6 font-medium text-gray-900">
          {dataset.name}
        </span>
        <span className="max-w-2xl text-sm text-gray-500">{dataset.id}</span>
      </div>
      {/*body*/}
      <div className="bg-gray-50 border-t border-gray-200">
        <dl className="space-y-4 px-4 py-4">
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {dataset.description}
            </dd>
          </div>
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">
              DAC Responsible
            </dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              {dataset.committeeDisplayName}
            </dd>
          </div>
          <div className="sm:grid sm:grid-cols-6">
            <dt className="text-sm font-medium text-gray-500">Data Uses</dt>
            <dd className="text-sm text-gray-900 sm:mt-0 sm:col-span-5">
              <div className="flex justify-start space-x-4">
                {dataset.dataUses.map((du, index) => (
                  <DataUseTable key={index} dataUse={du} showChecked={false} />
                ))}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export const DatasetsPage: React.FC = () => {
  const { createAxiosInstance } = useContext(UserLoggedInContext);

  const { isLoading, isError, data, error } = useQuery("ds", async () => {
    return await createAxiosInstance()
      .get<DatasetApiModel[]>(`/api/dataset`)
      .then((response) => response.data);
  });

  return (
    <LayoutStandardPage
      pageTitle="Datasets"
      includeResearcherCommitteeChoice={false}
    >
      <div className="container space-y-4">
        {isLoading && (
          <div>
            <ClipLoader />
          </div>
        )}
        {data && data.map((a, index) => <DatasetDiv dataset={a} key={index} />)}
        {isError && (
          <div>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
      </div>
    </LayoutStandardPage>
  );
};
