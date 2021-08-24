import React from "react";
import { useEnvRelay } from "../providers/env-relay-provider";
import {LayoutBase} from "../layouts/layout-base";
import { LayoutStandardPage } from "../layouts/layout-standard-page";
import {LayoutNoAuthPage} from "../layouts/layout-noauth-page";
import {useHistory} from "react-router-dom";
import {OktaAuth} from "@okta/okta-auth-js";
import classnames from "classnames";

type Props = {
  oktaAuth: OktaAuth
}

export const LoginPage: React.FC<Props> = ({oktaAuth}) => {

  return <LayoutNoAuthPage>
    <div className="w-full md:w-1/2 xl:w-1/3 p-6">
      <button
        className={classnames("btn", "btn-blue")}
        onClick={() => oktaAuth.signInWithRedirect({ })}
      >
        Login via CILogon
      </button>
      <p>
        You will need to be a member in the NAGIM CO for this login to work. See Patrick or Patto.
      </p>
    </div>

  </LayoutNoAuthPage>
};

/*
<idp entityID="https://idp.unimelb.edu.au/idp/shibboleth">
<Organization_Name>The University of Melbourne</Organization_Name>
<Display_Name>The University of Melbourne</Display_Name>
<Home_Page>http://unimelb.edu.au</Home_Page>
<Support_Name>AAF Support</Support_Name>
<Support_Address>mailto:support@aaf.edu.au</Support_Address>
<Technical_Name>AAF Support</Technical_Name>
<Technical_Address>mailto:support@aaf.edu.au</Technical_Address>
<SIRTFI>1</SIRTFI>
<REFEDS_RandS>1</REFEDS_RandS>
<RandS>1</RandS>
<Logout>https://idp.unimelb.edu.au/idp/profile/Logout</Logout>
</idp>

idphint=https%3A%2F%2Faccounts.google.com,https%3A%2F%2Fgithub.com,https%3A%2F%2Forcid.org,urn%3Amace%3Aincommon%3Auiuc.edu

 */