import React from "react";
import { Route, Switch, useHistory, useLocation } from "react-router-dom";
import { LoginCallback, SecureRoute, Security } from "@okta/okta-react";
import { OktaAuth, OktaAuthOptions, toRelativeUrl } from "@okta/okta-auth-js";
import { DatasetsPage } from "./pages/datasets";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { ApplicationsPage } from "./pages/applications";
import { ApplicationNewPage } from "./pages/application-new";
import { ApplicationTimelinePage } from "./pages/application-timeline";
import { UserModeProvider } from "./providers/user-mode-provider";
import { UserLoggedInProvider } from "./providers/user-logged-in-provider";
import { ApplicationEditPage } from "./pages/application-edit/application-edit";
import { useEnvRelay } from "./providers/env-relay-provider";
import axios from "axios";
import queryString from "query-string";

function NoMatch() {
  let location = useLocation();

  return (
    <div>
      <h3>
        No match for <code>{location.pathname}</code>
      </h3>
    </div>
  );
}

/**
 * The outer layer of our app including routing, security and any global providers.
 *
 * @constructor
 */
export const App: React.FC = () => {
  const history = useHistory();
  const { loginHost, loginClientId } = useEnvRelay();

  const oktaAuthConfig: OktaAuthOptions = {
    issuer: loginHost,
    clientId: "cilogon:/client_id/4101679de2bacb8ebe97394b3b2beae1",
    scopes: ["openid", "email", "profile"],
    redirectUri: window.location.origin + "/login/callback",
    devMode: true,
    pkce: true,
    tokenManager: {
      autoRenew: false,
      syncStorage: false,
      autoRemove: true,
      storageKey: 'didact-token-storage',
      storage: 'sessionStorage'
    }
  };

  if (loginHost.includes("cilogon")) {
    oktaAuthConfig.authorizeUrl = `${loginHost}/authorize`;
    oktaAuthConfig.userinfoUrl = `${loginHost}/oauth2/userinfo`;
    oktaAuthConfig.tokenUrl = `${loginHost}/oauth2/token`;
    oktaAuthConfig.revokeUrl = `${loginHost}/oauth2/revoke`;
    // until cilogon CORS is changed we can't fetch the certs to verify the sig
    // (which doesn't really matter - we don't particularly need to be convinced
    //  of the signature - its everyone else that needs to verify it)
    oktaAuthConfig.ignoreSignature =true;
    // because we are a public client to cilogon, this is the max scopes we can ask for
    oktaAuthConfig.scopes = [
      "openid"
    ];
    // the okta servers have a CORS setup that allows these two headers.. but because
    // CILogon (understandably) doesn't, we need to remove them from the outgoing
    // requests
    oktaAuthConfig.headers = {
      "Content-Type": null,
      "X-Okta-User-Agent-Extended": null,
    };
    // before we declare ourselves to be authenticated we also want to fetch a passport
    oktaAuthConfig.transformAuthState = async (oktaAuth, authState) => {
      // we can't do anything unless these are true (I presume they always are)
      if (!oktaAuth || !oktaAuth.token)
        return authState;
      if (!authState.isAuthenticated) {
        // try to get rid of this from the state whenever we know we aren't logged in
        delete (authState as any).passportToken;
        return authState;
      }
      // if we have a passport and plenty of valid expiresAt times, we can work out whether
      // we can skip fetching a new passport
      if (authState?.accessToken?.expiresAt && (authState as any)?.passportToken?.expiresAt) {
        if ((authState as any)?.passportToken?.expiresAt >= authState?.accessToken?.expiresAt)
          return authState;
      }

      if (authState.accessToken?.accessToken) {
        console.log("Doing passport exchange");
        const passportExchange = await axios.post(
          "https://broker.nagim.dev/broker/token",
          queryString.stringify({
            grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
            subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
            requested_token_type: "urn:ga4gh:token-type:compact-passport",
            subject_token: authState.accessToken.accessToken,
          }),
          {
            headers: { "content-type": "application/x-www-form-urlencoded" },
          }
        );
        console.log("Response");
        console.log(passportExchange);
        const passportJwt = passportExchange.data.access_token;
        console.log("Passport JWT");
        console.log(passportJwt);
        // note: this is a decode NOT A VERIFY.. but we don't really use
        // these claims for anything important (if at all)
        const passportContent = oktaAuth.token.decode(passportJwt);

        (authState as any).passportToken = {
          accessToken: passportJwt,
          claims: passportContent.payload,
          expiresAt: authState.accessToken.expiresAt,
          tokenType: authState.accessToken.tokenType,
        };
      }
      return authState;
    }
  }

  const oktaAuth = new OktaAuth(oktaAuthConfig);

  const onAuthRequired = () => {
    history.push("/login");
  };

  const restoreOriginalUri = async (
    _oktaAuth: OktaAuth,
    originalUri: string
  ) => {
    history.replace(toRelativeUrl(originalUri, window.location.origin));
  };

  return (
    <Security
      oktaAuth={oktaAuth}
      restoreOriginalUri={restoreOriginalUri}
      onAuthRequired={onAuthRequired}
    >
      {/* the user logged in provider is used to provide a *fake* 'logged in' user state - until our Idps can assert it */}
      <UserLoggedInProvider>
        {/* the user mode provider lets user switch between being a researcher or a committee member */}
        <UserModeProvider>
          <Switch>
            <Route path="/" exact={true} component={LandingPage} />
            <Route
              path="/login"
              exact={true}
              render={() => <LoginPage oktaAuth={oktaAuth} />}
            />
            <Route
              path="/login/callback"
              exact={true}
              render={() => <LoginCallback loadingElement={<p>Consulting broker to issue GA4GH passport/visas</p>} />}
            />
            {/* everything under the /p hierarchy will require being authenticated to view */}
            {/* note also that in order to truly be secure, ALL apis that are hit by these pages
            must *also* be protected */}
            <SecureRoute
              path="/p"
              render={({ match: { url } }) => (
                <Switch>
                  <Route path={`${url}/datasets`} component={DatasetsPage} />
                  <Route
                    path={`${url}/applications`}
                    component={ApplicationsPage}
                  />
                  <Route
                    path={`${url}/application-new`}
                    component={ApplicationNewPage}
                  />
                  <Route
                    path={`${url}/application-edit/:applicationId`}
                    component={ApplicationEditPage}
                  />
                  <Route
                    path={`${url}/application-timeline/:applicationId`}
                    component={ApplicationTimelinePage}
                  />
                  <Route path={`${url}/*`} render={() => <NoMatch />} />
                </Switch>
              )}
            />
            <Route path="*" render={() => <NoMatch />} />
          </Switch>
        </UserModeProvider>
      </UserLoggedInProvider>
    </Security>
  );
};
