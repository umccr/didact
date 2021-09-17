import React, { useState } from "react";

export type UserModeType = "researcher" | "committee";

export type UserMode = {
  mode: UserModeType;
  setResearcher: () => void;
  setCommittee: () => void;
};

export const UserModeContext = React.createContext<UserMode>({
  mode: "researcher",
  setResearcher: () => {},
  setCommittee: () => {},
});

/**
 * A state provider for the site that allows the user to choose between
 * being a researcher or a committee member
 *
 * @param props
 * @constructor
 */
export const UserModeProvider = (props: any) => {
  const [mode, setMode] = useState<UserModeType>("researcher");

  const setResearcher = () => {
    setMode("researcher");
  };
  const setCommittee = () => {
    setMode("committee");
  };

  return (
    <UserModeContext.Provider
      value={{
        mode: mode,
        setResearcher: setResearcher,
        setCommittee: setCommittee,
      }}
    >
      {props.children}
    </UserModeContext.Provider>
  );
};

