import React from "react";
import axios, { AxiosInstance } from "axios";
import { useOktaAuth } from "@okta/okta-react";
import { AccessToken } from "@okta/okta-auth-js";

export type UserLoggedIn = {
  createAxiosInstance: () => AxiosInstance;

  loggedIn: boolean;
  userId: string;
  userDisplayName: string;
  userBearerToken: string;
};

const defaultValue = {
  createAxiosInstance: () => axios.create({}),
  loggedIn: false,
  userId: "not logged in user id",
  userDisplayName: "not logged in",
  userBearerToken: "no bearer token",
};

export const UserLoggedInContext = React.createContext<UserLoggedIn>(
  defaultValue
);

/**
 * A provider that provides useful data out of the more raw Okta
 * context.
 *
 * @param props
 * @constructor
 */
export const UserLoggedInProvider = (props: any) => {
  const { authState } = useOktaAuth();

  let value = defaultValue;

  if (authState && authState.isAuthenticated && authState.accessToken && (authState as any).passportToken) {
    const passport: AccessToken = (authState as any).passportToken;

    value = {
      createAxiosInstance: () =>
        axios.create({
          headers: {
            Authorization: `Bearer ${passport.accessToken}`,
          },
        }),
      loggedIn: true,
      userId: passport?.claims["sub"] || "no subject",
      userDisplayName: passport?.claims["name"] || "no name claim",
      userBearerToken: passport.accessToken || "no passport bearer token"
    }
  }

  return (
    <UserLoggedInContext.Provider value={value}>
      {props.children}
    </UserLoggedInContext.Provider>
  );
};
