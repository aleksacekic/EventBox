import { api, API_BASE } from '../api';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const NAV_STAVKE = [
  { to: "/pocetna", label: "Pocetna", ikona: "la-home" },
  { to: "/profil", label: "Profil", ikona: "la-user" },
  { to: "/chat", label: "Poruke", ikona: "la-envelope" },
];

function Header() {
  const { userId } = useAuth();
  const navigate = useNavigate();

  const [korisnik, setKorisnik] = useState(null);
  const [meniOtvoren, setMeniOtvoren] = useState(false);
  // Broj nepročitanih stiže uživo (src/notifications.jsx) - nema više provere na svake 3 sekunde
  const { neprocitanePoruke } = useNotifications();

  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef();
  const profilRef = useRef();

  const prosledi = (id) => {
    setSearchResults([]);
    setSearchValue("");
    navigate(`/profilkorisnika/${id}`);
  };

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

  // Klik van pretrage zatvara rezultate, klik van profila zatvara padajuci meni
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
      if (profilRef.current && !profilRef.current.contains(event.target)) {
        setMeniOtvoren(false);
      }
    }
    function handleEsc(event) {
      if (event.key === "Escape") {
        setMeniOtvoren(false);
        setSearchResults([]);
      }
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
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

  const ucitajKorisnika = async () => {
    try {
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${userId}`);
      setKorisnik(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Profil.jsx javlja kad se promeni profilna slika, da avatar u headeru ne kasni do refresha
  useEffect(() => {
    window.addEventListener("korisnik-azuriran", ucitajKorisnika);
    return () => window.removeEventListener("korisnik-azuriran", ucitajKorisnika);
  }, []);

  const avatarSrc =
    korisnik && korisnik.korisnikImage
      ? `${API_BASE}/resources/${korisnik.korisnikImage}`
      : "http://via.placeholder.com/50x50";

  return (
    <header className="app-header">
      <div className="app-header-inner container">
        <div className="app-header-left">
          <Link to="/pocetna" className="app-header-logo" aria-label="Pocetna">
            <img src="/images/logosajt(4).ico" alt="EventBox" />
          </Link>

          <div className="app-header-search" ref={searchRef}>
            <form onSubmit={handleSearchSubmit}>
              <i className="la la-search" />
              <input
                type="text"
                name="search"
                placeholder="Pretrazi korisnike..."
                aria-label="Pretrazi korisnike"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoComplete="off"
              />
            </form>

            {searchResults.length > 0 && (
              <ul className="app-header-results">
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <button type="button" onClick={() => prosledi(result.id)}>
                      <span className="app-header-results-avatar">
                        {(result.ime || result.korisnicko_Ime || "?").charAt(0)}
                      </span>
                      <span className="app-header-results-text">
                        <strong>{result.ime} {result.prezime}</strong>
                        <small>@{result.korisnicko_Ime}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="app-header-nav" role="navigation" aria-label="Glavna navigacija">
          {NAV_STAVKE.map((stavka) => (
            <NavLink
              key={stavka.to}
              to={stavka.to}
              title={stavka.label}
              className={({ isActive }) => `app-header-link ${isActive ? "is-active" : ""}`}
            >
              <span className="app-header-link-icon">
                <i className={`la ${stavka.ikona}`} />
                {stavka.to === "/chat" && neprocitanePoruke > 0 && (
                  <span className="app-header-badge">
                    {neprocitanePoruke > 99 ? "99+" : neprocitanePoruke}
                  </span>
                )}
              </span>
              <span className="app-header-link-label">{stavka.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="app-header-right" ref={profilRef}>
          {korisnik ? (
            <>
              <button
                type="button"
                className={`app-header-profile ${meniOtvoren ? "is-open" : ""}`}
                onClick={() => setMeniOtvoren((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={meniOtvoren}
              >
                <img className="app-header-avatar" src={avatarSrc} alt="" />
                <span className="app-header-profile-name">{korisnik.ime}</span>
                <i className="la la-angle-down app-header-chevron" />
              </button>

              {meniOtvoren && (
                <div className="app-header-menu" role="menu">
                  <Link to="/profil" role="menuitem" onClick={() => setMeniOtvoren(false)}>
                    <i className="la la-user" /> Moj profil
                  </Link>
                  <Link to="/" role="menuitem" className="is-danger">
                    <i className="la la-sign-out" /> Odjavi se
                  </Link>
                </div>
              )}
            </>
          ) : (
            <span className="app-header-profile-name">Korisnik nije dostupan</span>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
