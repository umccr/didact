import React, { useContext } from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { useHistory } from "react-router-dom";
import { useQuery } from "react-query";
import { ApplicationApiModel } from "../../../shared-src/api-models/application";
import { UserModeContext } from "../providers/user-mode-provider";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import { ClipLoader } from "react-spinners";
import classnames from "classnames";
import { ApplicationSummaryDiv } from "./application-summary-div";

export const ApplicationsPage: React.FC = () => {
  const { push } = useHistory();
  const { mode } = useContext(UserModeContext);
  const { createAxiosInstance, userId } = useContext(UserLoggedInContext);

  const { isLoading, isError, data, error } = useQuery(
    ["applications", mode, userId],
    async ({ queryKey }) => {
      return await createAxiosInstance()
        .get<ApplicationApiModel[]>(
          queryKey[1] === "committee"
            ? `/api/application-c`
            : `/api/application-r`
        )
        .then((response) => response.data);
    }
  );

  return (
    <LayoutStandardPage
      pageTitle="Applications"
      includeResearcherCommitteeChoice={true}
    >
      <div className="container space-y-4">
        <div>
          <button
            className={classnames("btn", "btn-blue", {
              "opacity-50": mode !== "researcher",
              "cursor-not-allowed": mode !== "researcher",
            })}
            onClick={() => push("/p/application-new")}
            disabled={mode !== "researcher"}
          >
            New Application
          </button>
        </div>
        {isLoading && (
          <div>
            <ClipLoader />
          </div>
        )}
        {data &&
          data.map((a, index) => (
            <ApplicationSummaryDiv showFooter={true} application={a} key={index} />
          ))}
        {isError && (
          <div>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
      </div>
    </LayoutStandardPage>
  );
};
