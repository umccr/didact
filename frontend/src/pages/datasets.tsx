import React from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { useQuery } from "react-query";
import axios from "axios";
import { DatasetApiModel } from "../../../shared-src/api-models/dataset";

export const DatasetsPage: React.FC = () => {
  const { isLoading, isError, data, error } = useQuery("ds", async () => {
    const data = await axios
      .get<DatasetApiModel[]>(`/api/dataset`)
      .then((response) => response.data);

    return data;
  });

  return (
    <LayoutStandardPage pageTitle="Datasets" includeResearcherCommitteeChoice={false}>
      <div className="space-y-6">
            {data &&
        data.map((a, index) => (
          <div
            key={index}
            className="bg-white shadow overflow-hidden sm:rounded-lg"
          >
            <div className="px-4 py-5 sm:px-6 flex justify-between">
              <span className="text-lg leading-6 font-medium text-gray-900">
                {a.name}
              </span>
              <span className="mt-1 max-w-2xl text-sm text-gray-500">{a.id}</span>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {a.description}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Custodian
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {a.custodian}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">About</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    Fugiat ipsum ipsum deserunt culpa aute sint do nostrud anim
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ))}
      </div>
    </LayoutStandardPage>
  );
};
