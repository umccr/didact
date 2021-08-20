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
 * The user mode provider
 *
 * @param props
 * @constructor
 */
export const UserModeProvider = (props: any) => {
  const [mode, setMode] = useState<UserModeType>("researcher");

  const setResearcher = () => {
    console.log("Set researcher");
    setMode("researcher");
  };
  const setCommittee = () => {
    console.log("Set committee");
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

