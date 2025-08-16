import React from "react";
import { NavLink } from "react-router-dom";
import "./MainNav.css";

const MainNav: React.FC = () => {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      <div className="main-nav-container">
        <ul className="nav-list">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/games/number-guess"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Number Guess
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/games/tic-tac-toe"
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              Tic-Tac-Toe
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default MainNav;
