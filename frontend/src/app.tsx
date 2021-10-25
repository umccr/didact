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
import { NoPKCELoginCallback } from "./components/no-pkce-login-callback";

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

  let loginCallbackComponent = LoginCallback;

  const oktaAuthConfig: OktaAuthOptions = {
    issuer: loginHost,
    clientId: loginClientId,
    scopes: ["openid", "email", "profile"],
    redirectUri: window.location.origin + "/login/callback",
    devMode: true,
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
    oktaAuthConfig.responseType = ["code"];
    oktaAuthConfig.scopes = [
      "openid"
    ];
    oktaAuthConfig.pkce = false;
    // the okta servers have a CORS setup that allows these two headers.. but because
    // CILogon (understandably) doesn't, we need to remove them from the outgoing
    // requests
    oktaAuthConfig.headers = {
      "Content-Type": null,
      "X-Okta-User-Agent-Extended": null,
    };
    loginCallbackComponent = NoPKCELoginCallback;
  } else {
    oktaAuthConfig.pkce = true;
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
              component={loginCallbackComponent}
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
