import React, { useState } from "react";
import Avatar from './Avatar';
import { Link } from "react-router-dom";

function HeaderAdmin() {
  const [isActive, setIsActive] = useState(false);

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-data">
            <div className="logo">
              <Link to="/admin" aria-label="Administracija">
                <img src="/images/logosajt(4).ico" alt="EventBox" />
              </Link>
            </div>
            <div className="user-account">
              <div className="user-info">
                <Avatar className="profilnaslikaheader" ime="Administrator" />
                <i
                  className={`la la-sort-down ${isActive ? "active" : ""}`}
                  onClick={toggleActive}
                />
              </div>
              {isActive && (
                <div className="user-account-settingss active">
                  <h3 className="tc">
                    <Link to="/" className="odjavise">Odjavi se</Link>
                  </h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default HeaderAdmin;
