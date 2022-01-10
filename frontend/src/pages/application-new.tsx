import React, { useState } from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import classnames from "classnames";
import { SubmitHandler, useForm } from "react-hook-form";
import {
  ApplicationApiModel,
  ApplicationApiNewModel,
} from "../../../shared-src/api-models/application";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import axios from "axios";
import { useHistory } from "react-router-dom";

export const ApplicationNewPage: React.FC = () => {
  const { push } = useHistory();

  const { createAxiosInstance, userId, userDisplayName } = React.useContext(
    UserLoggedInContext
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationApiModel>();

  const onSubmit: SubmitHandler<ApplicationApiModel> = async (formData) => {
    const newApplication: ApplicationApiNewModel = {
      principalInvestigatorId: userId,
      projectTitle: formData.projectTitle,
      datasetId: formData.datasetId,
    };

    const apiData = await createAxiosInstance()
      .post<ApplicationApiModel>(`/api/application`, newApplication)
      .then((response) => response.data);

    push(`/p/application-edit/${apiData.id}`);
  };

  return (
    <LayoutStandardPage
      pageTitle="New Application"
      includeResearcherCommitteeChoice={false}
    >
      <div>
        <div className="md:grid md:grid-cols-4 md:gap-6">
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
          <div className="mt-5 md:mt-0 md:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="shadow sm:rounded-md sm:overflow-hidden">
                <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                  {/* applicant */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label
                        htmlFor="data-set-id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Applicant
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <span>
                          {userDisplayName} ({userId})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* principal investigator id */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label
                        htmlFor="principal-investigator-id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Principal Investigator
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <select
                          id="principal-investigator-id"
                          {...register("principalInvestigatorId")}
                        >
                          {/* TODO: replace with sourcing this from LDAP/backend */}
                          {[
                            {
                              id: "https://nagim.dev/p/kfuus-aodnv-10000",
                              displayName: "Andrew GmailPatterson",
                            },
                            {
                              id: "https://nagim.dev/p/txtpo-yhphm-10000",
                              displayName: "Andrew PattoPatterson",
                            },
                            {
                              id: "https://nagim.dev/p/wjaha-ppqrg-10000",
                              displayName: "Andrew UniMelbPatterson",
                            },
                          ].map((u, index) => (
                            <option key={index} value={u.id}>
                              {u.displayName} ({u.id})
                            </option>
                          ))}
                        </select>
                        {errors.principalInvestigatorId && (
                          <span>This field is required</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* data set id */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label
                        htmlFor="data-set-id"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Dataset Id
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        {/* TODO: replace with sourcing this from backend */}
                        <select id="data-set-id" {...register("datasetId")}>
                          <option value="urn:fdc:thetengenomeproject.org:2018:phase1">
                            10g Project
                          </option>
                          <option value="urn:fdc:australiangenomics.org.au:2018:study/1">
                            Mitochondrial Flagship
                          </option>
                          <option value="urn:fdc:australiangenomics.org.au:2018:study/2">
                            Heart Flagship
                          </option>
                          <option value="urn:fdc:australiangenomics.org.au:2018:study/3">
                            Cancer Flagship
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* project title */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-3 sm:col-span-2">
                      <label
                        htmlFor="project-title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Project Title
                      </label>
                      <div className="mt-1 flex rounded-md shadow-sm">
                        <input
                          type="text"
                          {...register("projectTitle", {
                            required: { value: true, message: "required" },
                          })}
                          className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-none rounded-r-md sm:text-sm border-gray-300"
                          placeholder="A Study of Things in Other Things"
                        />
                      </div>
                      {errors.projectTitle && (
                        <div className="mt-1 flex text-red-500">
                          {errors?.projectTitle?.message}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    className={classnames("btn", "btn-blue")}
                  >
                    Start Application Process
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </LayoutStandardPage>
  );
};

{
  /*
       <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"/>
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    className={classnames("btn", "btn-blue", {
                      "opacity-50": true,
                      "cursor-not-allowed": true,
                    })}
                  >
                    Start Application Process
                  </button>

 */
}
