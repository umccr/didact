import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import {LayoutBase} from "../layouts/layout-base";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import {LayoutNoAuthPage} from "../layouts/layout-noauth-page";
import {useHistory} from "react-router-dom";
import {OktaAuth} from "@okta/okta-auth-js";

type Props = {
  oktaAuth: OktaAuth
}

export const LoginPage: React.FC<Props> = ({oktaAuth}) => {

  return <LayoutNoAuthPage>
    <div className="w-full md:w-1/2 xl:w-1/3 p-6">
      <div className="bg-gradient-to-b from-green-200 to-green-100 border-b-4 border-green-600 rounded-lg shadow-xl p-5">
        <div className="flex flex-row items-center">
          <div className="flex-shrink pr-4">
            <div className="rounded-full p-5 bg-green-600">
              <i className="fa fa-wallet fa-2x fa-inverse"/>
            </div>
          </div>
          <div className="flex-1 text-right md:text-center">
            <h3 className="font-bold text-3xl">
              <button
                  onClick={() => {
                    oktaAuth.signInWithRedirect({});
                  }}
              >
                Initiate Login
              </button>
            </h3>
          </div>
        </div>
      </div>
    </div>

  </LayoutNoAuthPage>
};
