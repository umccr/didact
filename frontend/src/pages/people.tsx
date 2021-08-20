import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import { LayoutStandardPage } from "../layouts/layout-standard-page";

export const PeoplePage: React.FC = () => {
  const envRelay = useEnvRelay();

  return (
    <LayoutStandardPage pageTitle="People" includeResearcherCommitteeChoice={false}>
      <p>Hello people</p>
    </LayoutStandardPage>
  );
};
