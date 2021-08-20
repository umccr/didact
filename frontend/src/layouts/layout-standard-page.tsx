import React from "react";
import { LayoutBase } from "./layout-base";

type Props = {
  pageTitle: string;
  includeResearcherCommitteeChoice: boolean;
}

/**
 * A standard page layout, showing a sidebar, a nav, and then the
 * page content underneath. The page content includes a mandatory
 * styled `pageTitle`.
 *
 * @param children
 * @param pageTitle
 * @param includeResearcherCommitteeChoice (defaults to false)
 * @constructor
 */
export const LayoutStandardPage: React.FC<Props> = ({
  children,
  pageTitle,
  includeResearcherCommitteeChoice,
}) => {
  return (
    <LayoutBase showSidebar={true} showLinks={includeResearcherCommitteeChoice}>
      <main className="w-full flex-grow p-6">
        <h1 className="text-3xl text-black pb-6">{pageTitle}</h1>
        {children}
      </main>
    </LayoutBase>
  );
};
