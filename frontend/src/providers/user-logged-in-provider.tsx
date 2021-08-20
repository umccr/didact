import React, { useState } from "react";
import _ from "lodash";

/**
 * NOTE: this list needs to be kept up to date with that set up in backend setup-tests.
 * In reality this will be driven by an actual identity provider.
 */
const masterNagims: { [id: string]: string } = {
  Andrew: "https://nagim.dev/p/iukjm-ggypp-43356",
  Bob: "https://nagim.dev/p/ertyu-asrqe-34526",
  Alice: "https://nagim.dev/p/saqwfe-bvgfr-65987",
};

export type UserLoggedIn = {
  userList: string[];
  user: string;

  setUser: (user: string) => void;
  getUserBearer: (user: string) => string;
  getUserId: (user: string) => string;
};

function makeBearer(user: string): string {
  return `Bearer ${makeId(user)}`;
}

function makeId(user: string): string {
  if (user in masterNagims) return `${masterNagims[user]}`;

  return `notknownuser`;
}

export const UserLoggedInContext = React.createContext<UserLoggedIn>({
  userList: _.keys(masterNagims),
  user: "Andrew",
  setUser: (_: string) => {},
  getUserBearer: (_: string) => "",
  getUserId: (_: string) => "",
});

/**
 * This is a provider that holds state of the logged in user.
 * THIS IS A TEMPORARY CONTEXT THAT WOULD BE REMOVED AS SOON AS OUR IDP IS
 * ASSERTED CORRECT IDENTITIES.
 *
 * @param props
 * @constructor
 */
export const UserLoggedInProvider = (props: any) => {
  const [user, setUser] = useState<string>("Andrew");

  return (
    <UserLoggedInContext.Provider
      value={{
        userList: _.keys(masterNagims),
        user: user,
        setUser: setUser,
        getUserBearer: makeBearer,
        getUserId: makeId,
      }}
    >
      {props.children}
    </UserLoggedInContext.Provider>
  );
};
