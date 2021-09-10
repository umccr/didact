import React from "react";
import { Nav } from "./nav";
import { Sidebar } from "./sidebar";
import axios from "axios";

type Props = {
  showSidebar: boolean;
  showLinks: boolean;
};

// LayoutBase tailwind attributes (see also nav and sidebar) are modified from
// https://github.com/davidgrzyb/tailwind-admin-template/blob/master/blank.html
// APACHE licensed

export const LayoutBase: React.FC<Props> = ({
  children,
  showSidebar,
  showLinks,
}) => {
  return (
    <div className="bg-gray-100 flex">
      {showSidebar && <Sidebar />}

      <div className="relative w-full flex flex-col h-screen overflow-y-hidden">
        <Nav showLinks={showLinks} />

        <div className="w-full h-screen overflow-x-hidden border-t flex flex-col">
          {children}

          <footer className="w-full bg-white text-right p-4">UMCC<span onClick={() => {
            axios.post("/remove-me/reset");
          }}>R</span></footer>
        </div>
      </div>
    </div>
  );
};
