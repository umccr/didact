import React from "react";
import { LayoutNoAuthPage } from "../layouts/layout-noauth-page";
import { Link } from "react-router-dom";

export const LandingPage: React.FC = () => {
  return (
    <LayoutNoAuthPage>
      <div className="w-full p-6">
        <h1>Hello and welcome to Didact.</h1>
        <p>
          This is the landing page explaining things.. it has no menus or
          anything as it is unauthenticated. I would explain the purpose of the
          system.
        </p>
        <p>
          Click <Link to="/p/datasets" className="text-lg text-red-700">here</Link> to attempt to enter the system.
          Unless you are already logged in you will redirected to a login page (using institute/logins/cilogon).
        </p>
      </div>
    </LayoutNoAuthPage>
  );
};
