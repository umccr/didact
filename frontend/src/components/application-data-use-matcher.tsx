import { Concept } from "./concept-chooser/concept";
import { DataUseLimitation } from "../../../shared-src/api-models/data-use-limitation";
import React, { useState } from "react";
import classnames from "classnames";
import axios from "axios";
import { APPLICATION_EDIT_QUERY_NAME } from "../pages/application-edit";
import { useQueryClient } from "react-query";
import { UserLoggedInContext } from "../providers/user-logged-in-provider";
import { DataUseTable } from "./data-use-table";

type Props = {
  applicationId: string;
  applicationState: string;

  snomed: { [id: string]: Concept };
  hgnc: { [id: string]: Concept };

  dataUses: DataUseLimitation[];
};

type Evaluation = {
  messages: string[];
};

export const ApplicationDataUseMatcher: React.FC<Props> = ({
  applicationId,
  applicationState,
  snomed,
  hgnc,
  dataUses,
}) => {
  const queryClient = useQueryClient();

  const { user, getUserBearer } = React.useContext(UserLoggedInContext);

  const approveClick = async () => {
    const apiResponse = await axios
      .post<{}>(
        `/api/application/${applicationId}/approve`,
        {},
        {
          headers: {
            Authorization: getUserBearer(user),
          },
        }
      )
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const unapproveClick = async () => {
    const apiResponse = await axios
      .post<{}>(
        `/api/application/${applicationId}/unapprove`,
        {},
        {
          headers: {
            Authorization: getUserBearer(user),
          },
        }
      )
      .then((response) => response.data);

    await queryClient.invalidateQueries(APPLICATION_EDIT_QUERY_NAME);
  };

  const approveDisabled = ["started", "approved"].includes(applicationState);
  const unapproveDisabled = ["submitted", "started"].includes(applicationState);

  const [evaluateState, setEvaluateState] = useState<Evaluation[]>([]);

  const evaluateClick = async () => {
    const newEvaluateState: Evaluation[] = [];

    for (const du of dataUses) {
      console.log(`Evaluating ${JSON.stringify(du)}`);
      const messages: string[] = [];

      // we know how to check disease state
      if (du.code?.id === "DUO:0000007") {
        const ds = (du as any).disease.id;
        if (ds.startsWith("SNOMED:")) {
          const datasetSnomed = ds.substr(7);

          for (const entry of Object.entries(snomed)) {
            const applicationSnomed = entry[1].id;
            await axios
              .get<any>(
                `https://r4.ontoserver.csiro.au/fhir/CodeSystem/$subsumes?system=http://snomed.info/sct&codeA=${datasetSnomed}&codeB=${applicationSnomed}`
              )
              .then((result) => {
                for (const r of result.data?.parameter || []) {
                  if (r?.name === "outcome") {
                    messages.push(
                      `Check for ${applicationSnomed} against ${datasetSnomed} resulted in ${r?.valueCode}`
                    );
                  }
                }
              });
          }
        }
      }

      newEvaluateState.push({
        messages: messages,
      });
    }

    setEvaluateState(newEvaluateState);
  };

  return (
    <div className="shadow sm:rounded-md sm:overflow-hidden">
      <div className="px-4 py-3 bg-red-100 text-left sm:px-6">
        <label className="block text-sm font-medium text-gray-700">
          Committee Use Only
        </label>
        <button
          onClick={evaluateClick}
          className={classnames("btn", "btn-blue")}
        >
          Evaluate
        </button>
      </div>

      <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
        <div className="grid grid-cols-2 gap-6">
          {dataUses.map((du, index) => (
            <>
              <div key={index}>
                <DataUseTable dataUse={du} />
              </div>
              <div>
                {evaluateState &&
                  evaluateState.length === dataUses.length &&
                  evaluateState[index].messages.map((msg) => <p>{msg}</p>)}
              </div>
            </>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <div className="space-x-6">
          <button
            onClick={approveClick}
            className={classnames("btn", "btn-blue", {
              "opacity-50": approveDisabled,
              "cursor-not-allowed": approveDisabled,
            })}
            disabled={approveDisabled}
          >
            Approve
          </button>

          <button
            onClick={unapproveClick}
            className={classnames("btn", "btn-blue", {
              "opacity-50": unapproveDisabled,
              "cursor-not-allowed": unapproveDisabled,
            })}
            disabled={unapproveDisabled}
          >
            Unapprove
          </button>
        </div>
      </div>
    </div>
  );
};
