import React, { useContext } from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { LayoutBase } from "../layouts/layout-base";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { Link, useHistory } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import { ApplicationApiModel } from "../../../shared-src/api-models/application";
import { UserModeContext } from "../providers/user-mode-provider";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import classnames from "classnames";

export const ApplicationsPage: React.FC = () => {
  const { push } = useHistory();
  const { mode } = useContext(UserModeContext);
  const { user, getUserBearer } = useContext(UserLoggedInContext);

  const { isLoading, isError, data, error } = useQuery(
    ["applications", mode, user],
    async ({ queryKey }) => {
      const data = await axios
        .get<ApplicationApiModel[]>(
          queryKey[1] === "committee"
            ? `/api/application-c`
            : `/api/application-r`,
          {
            headers: {
              Authorization: getUserBearer(queryKey[2]),
            },
          }
        )
        .then((response) => response.data);

      return data;
    }
  );

  return (
    <LayoutStandardPage
      pageTitle="Applications"
      includeResearcherCommitteeChoice={true}
    >
      <div>
        <button
          className={classnames("btn", "btn-blue",{ "opacity-50": mode !== "researcher", "cursor-not-allowed": mode !== "researcher" })}
          onClick={() => push("/p/application-new")}
          disabled={mode !== "researcher"}
        >
          New Application
        </button>

        <div className="hidden sm:block" aria-hidden="true">
          <div className="py-5">
            <div className="border-t border-gray-200" />
          </div>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <th
            scope="col"
            className="w-1/12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Id
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Title
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Applicant
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            PI
          </th>
          <th scope="col" className="w-1/12 relative px-6 py-3">
            <span className="sr-only">Timeline</span>
          </th>
          <th scope="col" className="w-1/12 relative px-6 py-3">
            <span className="sr-only">Edit</span>
          </th>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data &&
            data.map((a, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">{a.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {a.projectTitle}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {a.applicantDisplayName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {a.principalInvestigatorDisplayName}
                </td>
                <td className=" px-6 py-4 whitespace-nowrap">
                  <Link
                    className="text-indigo-600 hover:text-indigo-900"
                    to={`/p/application-timeline/${a.id}`}
                  >
                    timeline
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    className="text-indigo-600 hover:text-indigo-900"
                    to={`/p/application-edit/${a.id}`}
                  >
                    edit
                  </Link>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </LayoutStandardPage>
  );
};
