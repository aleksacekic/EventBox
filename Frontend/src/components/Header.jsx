import { api } from '../api';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { ADMIN_TABOVI, adminUserUrl, adminTabUrl } from '../utils/admin';
import Avatar from './Avatar';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

const NAV_STAVKE = [
  { to: "/pocetna", label: "Pocetna", ikona: "la-home" },
  { to: "/profil", label: "Profil", ikona: "la-user" },
  { to: "/chat", label: "Poruke", ikona: "la-envelope" },
];

// Isti header za korisnika i administratora. Administrator ima drugu boju (app-header--admin),
// a stavke navigacije vode na tabove admin stranice (/admin?tab=...). Pretraga korisnika je
// ista, samo kod administratora rezultat otvara admin pregled korisnika umesto profila.
function Header() {
  const { userId, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [korisnik, setKorisnik] = useState(null);
  const [meniOtvoren, setMeniOtvoren] = useState(false);
  // Broj nepročitanih stiže uživo (src/notifications.jsx) - nema više provere na svake 3 sekunde
  const { unreadCount } = useNotifications();

  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef();
  const profilRef = useRef();

  // Aktivan admin tab (nijedan dok je otvoren pregled korisnika ili info stranica)
  const aktivniTab = location.pathname === "/admin" && !params.get("korisnik")
    ? (params.get("tab") || "prijave")
    : null;

  const openUser = (id) => {
    setSearchResults([]);
    setSearchValue("");
    navigate(isAdmin ? adminUserUrl(id) : `/profilkorisnika/${id}`);
  };

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

  // Pretraga dok se kuca: kratka pauza (ne zahtev na svako slovo), unos se kodira (znakovi
  // poput / ? # inace kvare adresu), a zakasneli odgovor za stari unos se ignorise
  useEffect(() => {
    const unos = searchValue.trim();
    if (unos === "") {
      setSearchResults([]);
      return;
    }
    let vazi = true;
    const tajmer = setTimeout(async () => {
      try {
        const data = await api.get(`/api/users/search?query=${encodeURIComponent(unos)}`);
        if (vazi) setSearchResults(Array.isArray(data) ? data : []); // { kraj: "KRAJ" } = nema rezultata
      } catch (error) {
        console.error("Greška prilikom pretrage:", error);
      }
    }, 250);
    return () => {
      vazi = false;
      clearTimeout(tajmer);
    };
  }, [searchValue]);

  // Administrator nije korisnik (nema profil), pa za njega nema sta da se ucita
  const loadUser = useCallback(async () => {
    if (isAdmin || !userId) return;
    try {
      setKorisnik(await api.get(`/api/users/${userId}`));
    } catch (error) {
      console.log(error);
    }
  }, [isAdmin, userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Profile.jsx javlja kad se promeni profilna slika, da avatar u headeru ne kasni do refresha
  useEffect(() => {
    window.addEventListener("user-updated", loadUser);
    return () => window.removeEventListener("user-updated", loadUser);
  }, [loadUser]);

  return (
    <header className={`app-header ${isAdmin ? "app-header--admin" : ""}`}>
      <div className="app-header-inner container">
        <div className="app-header-left">
          <Link to={isAdmin ? "/admin" : "/pocetna"} className="app-header-logo" aria-label={isAdmin ? "Administracija" : "Pocetna"}>
            <img src="/images/logosajt(4).ico" alt="EventBox" />
          </Link>

          <div className="app-header-search" ref={searchRef}>
            <form onSubmit={(e) => e.preventDefault()}>
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
                    <button type="button" onClick={() => openUser(result.id)}>
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
          {isAdmin
            ? ADMIN_TABOVI.map((stavka) => (
                <Link
                  key={stavka.tab}
                  to={adminTabUrl(stavka.tab)}
                  title={stavka.label}
                  aria-current={aktivniTab === stavka.tab ? "page" : undefined}
                  className={`app-header-link ${aktivniTab === stavka.tab ? "is-active" : ""}`}
                >
                  <span className="app-header-link-icon">
                    <i className={`la ${stavka.ikona}`} />
                  </span>
                  <span className="app-header-link-label">{stavka.label}</span>
                </Link>
              ))
            : NAV_STAVKE.map((stavka) => (
                <NavLink
                  key={stavka.to}
                  to={stavka.to}
                  title={stavka.label}
                  className={({ isActive }) => `app-header-link ${isActive ? "is-active" : ""}`}
                >
                  <span className="app-header-link-icon">
                    <i className={`la ${stavka.ikona}`} />
                    {stavka.to === "/chat" && unreadCount > 0 && (
                      <span className="app-header-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="app-header-link-label">{stavka.label}</span>
                </NavLink>
              ))}
        </div>

        <div className="app-header-right" ref={profilRef}>
          {isAdmin || korisnik ? (
            <>
              <button
                type="button"
                className={`app-header-profile ${meniOtvoren ? "is-open" : ""}`}
                onClick={() => setMeniOtvoren((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={meniOtvoren}
              >
                <Avatar
                  className="app-header-avatar"
                  slika={isAdmin ? null : korisnik.korisnikImage}
                  ime={isAdmin ? "Administrator" : korisnik.ime}
                />
                <span className="app-header-profile-name">{isAdmin ? "Administrator" : korisnik.ime}</span>
                <i className="la la-angle-down app-header-chevron" />
              </button>

              {meniOtvoren && (
                <div className="app-header-menu" role="menu">
                  {isAdmin ? (
                    <Link to={adminTabUrl("administratori")} role="menuitem" onClick={() => setMeniOtvoren(false)}>
                      <i className="la la-user-secret" /> Administratori
                    </Link>
                  ) : (
                    <Link to="/profil" role="menuitem" onClick={() => setMeniOtvoren(false)}>
                      <i className="la la-user" /> Moj profil
                    </Link>
                  )}
                  {/* Strana za prijavu pri otvaranju poziva logout() (odjava i na serveru) */}
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
