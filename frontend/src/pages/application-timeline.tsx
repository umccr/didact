import React from "react";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import axios from "axios";
import { ApplicationApiModel, ApplicationEventApiModel } from "../../../shared-src/api-models/application";
import classnames from "classnames";

type TimelineEntryProps = {
  event: ApplicationEventApiModel;
}

const TimelineEntry: React.FC<TimelineEntryProps> = ({ event }) => {
  const overallDivClasses = classnames(
    ["mb-8", "flex", "justify-between", "items-center", "w-full"],
    {
      "right-timeline": event.as === "committee",
      "left-timeline": event.as !== "committee",
      "flex-row-reverse": event.as !== "committee",
    }
  );
  const innerDivClasses = classnames(
    ["order-1", "w-5/12", "px-1", "py-4"],
    {
      "text-right": event.as !== "committee",
      "text-left": event.as === "committee",
    }
  );

  return (
    <div className={overallDivClasses}>
      <div className="order-1 w-5/12" />
      <div className={innerDivClasses}>
        <p className="mb-3 text-base text-gray-500">{event.when}</p>
        <h4 className="mb-3 font-bold text-lg md:text-2xl">
          {event.action} by {event.byName}
        </h4>
        <p className="text-sm md:text-base leading-snug text-gray-500 text-opacity-100">
          {event.detail}
        </p>
      </div>
    </div>
  );
}


export const ApplicationTimelinePage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const { isLoading, isError, data, error } = useQuery(
    ["application-timeline", applicationId],
    async ({ queryKey }) => {
      const data = await axios
        .get<ApplicationApiModel>(`/api/application/${queryKey[1]}`)
        .then((response) => response.data);

      return data;
    }
  );

  return (
    <LayoutStandardPage
      pageTitle="Application Timeline"
      includeResearcherCommitteeChoice={false}
    >
      {data && (
        <div className="container mx-auto w-full">
          <h1>{data.projectTitle}</h1>
          <h2>{data.state}</h2>
          <h3>{data.datasetId}</h3>
          <div className="hidden sm:block" aria-hidden="true">
            <div className="py-5">
              <div className="border-t border-gray-200" />
            </div>
          </div>
          <div className="relative wrap overflow-hidden p-10">
            {/* main central divider */}
            <div
              className="border-2-2 border-yellow-555 absolute h-full border"
              style={{
                right: "50%",
                border: "2px solid #FFC100",
                borderRadius: "1%",
              }}
            />
            <div
              className="border-2-2 border-yellow-555 absolute h-full border"
              style={{
                left: "50%",
                border: "2px solid #FFC100",
                borderRadius: "1%",
              }}
            />
            {/* timeline entries */}
            {data.events.map((ev, index) => <TimelineEntry event={ev}/>)}
          </div>
        </div>
      )}
      {error && (
        <div>
          <pre>{JSON.stringify(error)}</pre>
        </div>
      )}
    </LayoutStandardPage>
  );
};
