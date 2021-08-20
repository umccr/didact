import React from "react";
import { Link, NavLink, useRouteMatch } from "react-router-dom";
import classNames from "classnames";

type Props = {
  to: string;
  activeOnlyWhenExact: boolean;
};

const CustomSidebarLink: React.FC<Props> = ({
  children,
  to,
  activeOnlyWhenExact,
}) => {
  let match = useRouteMatch({
    path: to,
    exact: activeOnlyWhenExact,
  });

  const linkClass = classNames(
    ["flex", "items-center", "text-white", "py-4", "pl-6"],
    {
      "opacity-75": !match,
      "hover:opacity-100": !match,
      "hover:bg-blue-400": !match,
      "hover:bg-blue-600": match,
      "bg-blue-500": match,
    }
  );

  return (
    <Link to={to} className={linkClass}>
      {children}
    </Link>
  );
};

export const Sidebar: React.FC = ({ children }) => {
  return (
    <aside className="relative bg-blue-300 h-screen w-64 hidden sm:block shadow-xl">
      <div className="p-6">
        <Link
          to="/"
          className="text-white text-3xl font-semibold uppercase hover:text-gray-300"
        >
          Didact
        </Link>

        {/*<button
                    className="w-full bg-white cta-btn font-semibold py-2 mt-5 rounded-br-lg rounded-bl-lg rounded-tr-lg shadow-lg hover:shadow-xl hover:bg-gray-300 flex items-center justify-center">
                    <i className="fas fa-plus mr-3"></i> New Report
                </button> */}
      </div>
      <nav className="text-white text-base font-semibold pt-3">
        <CustomSidebarLink to="/p/datasets" activeOnlyWhenExact={false}>
          Datasets
        </CustomSidebarLink>
        <CustomSidebarLink to="/p/applications" activeOnlyWhenExact={false}>
          Applications
        </CustomSidebarLink>
      </nav>
    </aside>
  );
};
