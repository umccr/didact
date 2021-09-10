/*
 * Copyright (c) 2017-Present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

import * as React from "react";
import { useOktaAuth } from "@okta/okta-react";
import { useHistory, useLocation } from "react-router-dom";
import queryString from "query-string";
import axios from "axios";
import { IDToken, Tokens, toRelativeUrl } from "@okta/okta-auth-js";

interface LoginCallbackProps {
  errorComponent?: React.ComponentType<{ error: Error }>;
  loadingElement?: React.ReactElement;
}

/**
 * The no PKCE login callback is an attempt to allow us to keep a SPA that is set up for
 * PKCE flows - but temporarily use it on a server that does not support it. So it is an
 * authorisation code flow - with no client secret held on the client.
 *
 * So we intercept the code coming back - and do an exchange with our backend - and
 * the backend completes the rest of the auth code flow by also doing an exchange that
 * includes the client secret.
 *
 * @param errorComponent
 * @param loadingElement
 * @constructor
 */
export const NoPKCELoginCallback: React.FC<LoginCallbackProps> = ({
  errorComponent,
  loadingElement = null,
}) => {
  const { oktaAuth, authState } = useOktaAuth();
  const [callbackError, setCallbackError] = React.useState(null);

  const location = useLocation();
  const history = useHistory();

  // an async callback to do two token exchanges - turning out PKCE code into
  // a GA4GH passport access token
  const doExchangesCallback = React.useCallback(
    async () => {
      const qs = queryString.parse(location.search);

      if (!qs.code || !qs.state) {
        console.log("NoPkceCallback but no code");
        return;
      }

      const pkceExchange = await axios.post("/login/exchange", {
        code: qs.code,
        state: qs.state,
      });

      const tokenDict = {} as Tokens;
      const expiresIn = pkceExchange.data.expires_in;
      const tokenType = pkceExchange.data.token_type;
      const accessToken: string = pkceExchange.data.access_token;
      const idToken: string = pkceExchange.data.id_token;
      const refreshToken: string | undefined = pkceExchange.data.refresh_token;
      const now = Math.floor(Date.now() / 1000);

      if (accessToken) {
        // try exchanging this access token for a different one
        const passportExchange = await axios.post(
          "/broker/exchange",
          queryString.stringify({
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
            requested_token_type: "urn:ga4gh:token-type:self-contained-passport",
            subject_token: accessToken,
          }),
          {
            headers: { "content-type": "application/x-www-form-urlencoded" },
          }
        );

        const accessJwt = oktaAuth.token.decode(
          passportExchange.data.access_token
        );

        tokenDict.accessToken = {
          accessToken: passportExchange.data.access_token,
          claims: accessJwt.payload,
          expiresAt: Number(expiresIn) + now,
          tokenType: tokenType,
          scopes: oktaAuth.options.scopes!,
          authorizeUrl: oktaAuth.options.authorizeUrl!,
          userinfoUrl: oktaAuth.options.userinfoUrl!,
        };
      }

      if (refreshToken) {
        tokenDict.refreshToken = {
          refreshToken: refreshToken,
          expiresAt: Number(expiresIn) + now, // should not be used, this is the accessToken expire time
          scopes: oktaAuth.options.scopes!,
          tokenUrl: oktaAuth.options.tokenUrl!,
          authorizeUrl: oktaAuth.options.authorizeUrl!,
          issuer: oktaAuth.options.issuer!,
        };
      }

      if (idToken) {
        const idJwt = oktaAuth.token.decode(idToken);

        tokenDict.idToken = {
          idToken: idToken,
          claims: idJwt.payload,
          expiresAt: idJwt.payload.exp! - idJwt.payload.iat! + now, // adjusting expiresAt to be in local time
          scopes: oktaAuth.options.scopes!,
          authorizeUrl: oktaAuth.options.authorizeUrl!,
          issuer: oktaAuth.options.issuer!,
          clientId: oktaAuth.options.clientId!,
        };
      }

      console.log(
        "The following tokens were the result of all our token exchanges"
      );
      console.log(tokenDict);

      oktaAuth.tokenManager.setTokens(tokenDict);

      // ensure auth state has been updated
      oktaAuth.authStateManager.updateAuthState().then(() => {
        // Get and clear originalUri from storage
        const originalUri = oktaAuth.getOriginalUri();
        oktaAuth.removeOriginalUri();

        history.replace(toRelativeUrl(originalUri, window.location.origin));
      });
    },
    [oktaAuth, location, history]
  );

  React.useEffect(() => {
    doExchangesCallback().then(r => null);
  }, [doExchangesCallback]);

  const authError = authState?.error;
  const displayError = callbackError || authError;
  if (displayError) {
    return <div>{displayError}</div>;
  }

  return loadingElement;
};
