import React, { useState } from "react";
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
              <a href="index.html">
                <img src="/images/logosajt(4).ico" />
              </a>
            </div>
            <div className="user-account">
              <div className="user-info">
                <img
                  className="profilnaslikaheader"
                  src={"http://via.placeholder.com/50x50"}
                />
                <i
                  className={`la la-sort-down ${isActive ? "active" : ""}`}
                  onClick={toggleActive}
                />
              </div>
              {isActive && (
                <div className="user-account-settingss active">
                  <h3 className="tc">
                    <Link to="/">
                      <a className="odjavise">Odjavi se</a>
                    </Link>
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
