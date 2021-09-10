import classnames from "classnames";
import React from "react";
import { Link } from "react-router-dom";
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
      <header className="w-full items-center bg-white py-2 px-6 hidden sm:flex">
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

      {/*mobile header
    <header  className="w-full bg-sidebar py-5 px-6 sm:hidden">
        <div className="flex items-center justify-between">
            <a href="index.html" className="text-white text-3xl font-semibold uppercase hover:text-gray-300">Admin</a>
            <button className="text-white text-3xl focus:outline-none">
            <i  className="fas fa-bars"></i>
            <i  className="fas fa-times"></i>
                </button>
            </div>

            <nav className="flex flex-col pt-4">
                <a href="index.html" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-tachometer-alt mr-3"></i>
            Dashboard
            </a>
            <a href="blank.html" className="flex items-center active-nav-link text-white py-2 pl-4 nav-item">
                <i className="fas fa-sticky-note mr-3"></i>
                Blank Page
            </a>
            <a href="tables.html" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-table mr-3"></i>
                Tables
            </a>
            <a href="forms.html" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-align-left mr-3"></i>
                Forms
            </a>
            <a href="tabs.html" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-tablet-alt mr-3"></i>
                Tabbed Content
            </a>
            <a href="calendar.html" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-calendar mr-3"></i>
                Calendar
            </a>
            <a href="#" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-cogs mr-3"></i>
                Support
            </a>
            <a href="#" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-user mr-3"></i>
                My Account
            </a>
            <a href="#" className="flex items-center text-white opacity-75 hover:opacity-100 py-2 pl-4 nav-item">
                <i className="fas fa-sign-out-alt mr-3"></i>
                Sign Out
            </a>
            <button className="w-full bg-white cta-btn font-semibold py-2 mt-3 rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-300 flex items-center justify-center">
                <i className="fas fa-arrow-circle-up mr-3"></i> Upgrade to Pro!
            </button>
        </nav>
        </header>*/}
    </>
  );
};

/* const FancyLink = React.forwardRef<HTMLAnchorElement>((props, ref) => (
  <li className="flex-1 md:flex-none md:mr-3">
    <a
      className="inline-block py-2 px-4 text-white no-underline"
      ref={ref}
      {...props}
    >
      {" "}
      {props.children}
    </a>
  </li>
));
*/