import React from "react";
import axios, { AxiosInstance } from "axios";
import { useOktaAuth } from "@okta/okta-react";

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

  const value =
    authState && authState.isAuthenticated && authState.accessToken
      ? {
          createAxiosInstance: () =>
            axios.create({
              headers: {
                Authorization: `Bearer ${authState.accessToken?.accessToken}`,
              },
            }),
          loggedIn: true,
          userId: authState.idToken?.claims["sub"] || "no subject",
          userDisplayName: authState.idToken?.claims["name"] || "no name claim",
          userBearerToken: authState.accessToken?.accessToken || "no bearer token"
        }
      : defaultValue;

  return (
    <UserLoggedInContext.Provider value={value}>
      {props.children}
    </UserLoggedInContext.Provider>
  );
};
