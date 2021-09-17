import classnames from "classnames";
import React from "react";
import { UserModeContext } from "../providers/user-mode-provider";
import {UserLoggedInContext} from "../providers/user-logged-in-provider";

type Props = {
  showLinks: boolean;
};

/**
 * The navigation bar at the top of the content page - with enough 'smart' parametrisation that it
 * visibility of items can be configured.
 *
 * @param showLinks
 * @constructor
 */
export const Nav: React.FC<Props> = ({  showLinks }) => {
  const { mode, setResearcher, setCommittee } = React.useContext(
    UserModeContext
  );

  const { userDisplayName } = React.useContext(
      UserLoggedInContext
  );

  const buttonClasses = [
    "p-2",
    "rounded-full",
    "border-2",
    "border-gray-300",
    "hover:border-gray-400",
  ];
  const researchButtonClasses = classnames(buttonClasses, {
    "opacity-50": mode !== "researcher",
  });
  const committeeButtonClasses = classnames(buttonClasses, {
    "opacity-50": mode !== "committee",
  });

  return (
    <>
      {/*desktop header*/}
      <header className="w-full items-center bg-white py-2 px-6 sm:flex">
        <div className="w-3/4 flex space-x-6">
          {showLinks && (
            <>
              <div className="flex items-center">
                <input
                    id="researcher-hat"
                    name="mode"
                    type="radio"
                    checked={mode === "researcher"}
                    onClick={setResearcher}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="researcher-hat" className="ml-3 block text-sm font-medium text-gray-700">
                  I have my researcher hat on
                </label>
              </div>

              <div className="flex items-center">
                <input
                    id="committee-hat"
                    name="mode"
                    type="radio"
                    checked={mode === "committee"}
                    onClick={setCommittee}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="committee-hat" className="ml-3 block text-sm font-medium text-gray-700">
                  I have my committee hat on
                </label>
              </div>
            </>
          )}
        </div>
        <div className="relative w-1/4 flex justify-end">
          <p>{userDisplayName}</p>


            {/*
          <button className="relative z-10 w-12 h-12 rounded-full overflow-hidden border-4 border-gray-400 hover:border-gray-300 focus:border-gray-300 focus:outline-none"/>

            <button className="h-full w-full fixed inset-0 cursor-default" />
          <div className="absolute w-32 bg-white rounded-lg shadow-lg py-2 mt-16">
            <a
              href="#"
              className="block px-4 py-2 account-link hover:text-white"
            >
              Account
            </a>
            <a
              href="#"
              className="block px-4 py-2 account-link hover:text-white"
            >
              Support
            </a>
            <a
              href="#"
              className="block px-4 py-2 account-link hover:text-white"
            >
              Sign Out
            </a>
          </div>*/}
        </div>
      </header>

    </>
  );
};
