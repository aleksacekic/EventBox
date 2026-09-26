import { api, API_BASE } from '../api';
import { useAuth } from '../auth';
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import moment from "moment";

import { useNavigate } from "react-router-dom";

function Header() {
  const { userId } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();
  const [isActive, setIsActive] = useState(false);
  const [neprocitanePoruke, setNeprocitanePoruke] = useState(0);

  const navigate = useNavigate();

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const prosledi = (id) => {
    navigate(`/profilkorisnika/${id}`);
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClickOutside = () => {
    setIsMenuOpen(false);
  };

  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef();

  function prikaziFormu() {
    var forma = document.querySelector(".notifikacije-forma");
    forma.style.display = "flex";
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();

    try {
      const data = await api.get(`/Korisnik/VratiKorisnikeSearch/${searchValue}`);
      if (data.kraj === "KRAJ") {
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Greška prilikom pretrage:", error);
    }
  }

  function handleClickOutside(event) {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setSearchResults([]);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function searchUsers() {
      if (searchValue === "") {
        setSearchResults([]);
        return;
      }

      try {
        const data = await api.get(`/Korisnik/VratiKorisnikeSearch/${searchValue}`);
        if (data.kraj === "KRAJ") {
          setSearchResults([]);
        } else {
          setSearchResults(data);
        }
      } catch (error) {
        console.error("Greška prilikom pretrage:", error);
      }
    }

    searchUsers();
  }, [searchValue]);

  useEffect(() => {
    ucitajKorisnika();
  }, []);

  const formatirajDatum = (datum) => {
    return moment(datum).format("DD.MM.YYYY");
  };

  const ucitajKorisnika = async () => {
    try {
      const korisnik_Id = userId;
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      const formatiranDatum = formatirajDatum(data.datum_rodjenja);
      data.datumrodjenja = formatiranDatum;
      setKorisnik(data);
      setmojdatum(formatiranDatum);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const korisnik_Id = userId;
    if (!korisnik_Id) return;

    async function fetchNeprocitanePoruke() {
      try {
        const broj = await api.get(`/Poruka/KolikoNeprocitanihPoruka/${korisnik_Id}`);
        setNeprocitanePoruke(broj);
      } catch (error) {
        console.error("Greska prilikom dohvatanja neprocitanih poruka:", error);
      }
    }

    fetchNeprocitanePoruke();
    const interval = setInterval(fetchNeprocitanePoruke, 3000); //proverava na svake 3 sekunde

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-data">
            <div className="logo">
              <Link to="/pocetna">
                <a href="index.html">
                  <img src="/images/logosajt(4).ico" />
                </a>
              </Link>
            </div>
            <div className="search-bar" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  name="search"
                  placeholder="Pretrazi korisnike..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit">
                  <i className="la la-search" />
                </button>
                {/* Prikaz rezultata pretrage */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    <ul className="search-results-list">
                      {searchResults.map((result) => (
                        <li key={result.id} className="search-result-item">
                          <div
                            className="search-podaci"
                            onClick={() => {
                              prosledi(result.id);
                            }}
                          >
                            <span className="prvispansearch">
                              @{result.korisnicko_Ime}
                            </span>
                            <span>
                              {result.ime} {result.prezime}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </form>
            </div>
            <nav
              className={isMenuOpen ? "active" : ""}
              onClick={handleMenuClickOutside}
            >
              <h3 className="odeljcihamburgermenu" style={{ display: "none" }}>
                Odeljci
              </h3>
              <ul>
                <li>
                  <a style={{ display: "block" }}>
                    <span>
                      <img src="/images/icon1.png" />
                    </span>
                    <Link to="/pocetna">Pocetna</Link>
                  </a>
                </li>
                <li>
                  <a>
                    <span>
                      <img src="/images/icon4.png" />
                    </span>
                    <Link to="/profil">Profil</Link>
                  </a>
                </li>
                {/* <li class="chat-icon">
                  <a>
                    <span>
                      <img src="/images/icon6.png" />

                      <div className="notification-badge">
                        {neprocitanePoruke}
                      </div>
                    </span>
                    <Link to="/chat">Poruke</Link>
                  </a>
                </li> */}
                <li className="chat-icon">
                  <Link to="/chat" className="chat-link">
                    <span className="chat-icon-container">
                      <img src="/images/icon6.png" alt="Poruke" />
                      {neprocitanePoruke > 0 && (
                        <div className="notification-badge">
                          {neprocitanePoruke}
                        </div>
                      )}
                    </span>
                    Poruke
                  </Link>
                </li>

                <li>
                  <a
                    href="#"
                    className="not-box-open notifikacije-u-hederu"
                    onClick={prikaziFormu}
                    style={{ display: "none" }}
                  >
                    <span>
                      <img src="/images/icon7.png" />
                    </span>
                    Notifikacije
                  </a>
                </li>
              </ul>
            </nav>
            <div className="menu-btn">
              <a href="#" onClick={handleMenuToggle}>
                <i className="fa fa-bars" />
              </a>
            </div>
            <div className="user-account">
              {korisnik ? (
                <>
                  <div className="user-info">
                    <img
                      className="profilnaslikaheader"
                      src={
                        korisnik.korisnikImage
                          ? `${API_BASE}/resources/${korisnik.korisnikImage}`
                          : "http://via.placeholder.com/50x50"
                      }
                    />
                    <a href="#">{korisnik.ime}</a>
                    <i
                      className={`la la-sort-down ${isActive ? "active" : ""}`}
                      onClick={toggleActive}
                    />
                  </div>
                  {isActive && (
                    <div className="user-account-settingss active">
                      {/* <h3>Podesavanja</h3>
                      <ul className="us-links">
                        <li><a href="profile-account-setting.html">Podesavanja profila</a></li>
                      </ul> */}
                      <h3 className="tc">
                        <Link to="/">
                          <a className="odjavise">Odjavi se</a>
                        </Link>
                      </h3>
                    </div>
                  )}
                </>
              ) : (
                <p>Korisnik nije dostupan</p>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Header;
