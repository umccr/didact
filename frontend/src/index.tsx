import React from "react";
import ReactDOM from "react-dom";
import { App } from "./app";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import {
  DeployedEnvironments,
  EnvRelayProvider,
} from "./providers/env-relay-provider";
import { QueryClient, QueryClientProvider } from "react-query";

const root = document.getElementById("root");

if (root != null) {
  // if we detect any failure this is a bare bones response we can generate
  const renderMessage = (msg: string) => {
    ReactDOM.render(
      <React.StrictMode>
        <p>{msg}</p>
      </React.StrictMode>,
      document.getElementById("root")
    );
  };

  // there is a variety of backend environment and deploy time information that we would like to be known by the
  // React code
  // the pattern we use is that when the index page is served up by the server - it can do a string
  // search replace to set data attributes
  //      data-semantic-version="1.2.3"
  // in the index.html that goes to the client
  // in the react this then comes into the root element as a dataset (via HTML5 standard behaviour)
  // e.g.
  // root.dataset.semanticVersion
  // (NOTE: the conversion from kebab casing to camel casing is AUTOMATIC as part of HTML5!)
  const sv = root.dataset.semanticVersion || "undefined version";
  const bv = root.dataset.buildVersion || "-1";
  const de = (root.dataset.deployedEnvironment ||
    "development") as DeployedEnvironments;

  const queryClient = new QueryClient();

  ReactDOM.render(
    <React.StrictMode>
      {/* the env relay converts the backend index.html info into strongly typed values accessible throughout */}
      <EnvRelayProvider
        semanticVersion={sv}
        buildVersion={bv}
        deployedEnvironment={de}
      >
        {/* the query provider comes from react-query and provides standardised remote query semantics */}
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </EnvRelayProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );
}
