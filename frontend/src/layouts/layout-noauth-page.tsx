import React from "react";
import { LayoutBase } from "./layout-base";

export const LayoutNoAuthPage: React.FC = ({ children }) => {
  return <LayoutBase showSidebar={false} showLinks={false}>
    <main className="w-full flex-grow p-6">
      {children}
    </main>
  </LayoutBase>
};
