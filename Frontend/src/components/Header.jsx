import { api } from '../api';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { ADMIN_TABOVI, adminUserUrl, adminTabUrl } from '../utils/admin';
import Avatar from './Avatar';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

const NAV_STAVKE = [
  { to: "/pocetna", labelKey: "nav.home", ikona: "la-home" },
  { to: "/profil", labelKey: "nav.profile", ikona: "la-user" },
  { to: "/chat", labelKey: "nav.messages", ikona: "la-envelope" },
];

// Isti header za korisnika i administratora. Administrator ima drugu boju (app-header--admin),
// a stavke navigacije vode na tabove admin stranice (/admin?tab=...). Pretraga korisnika je
// ista, samo kod administratora rezultat otvara admin pregled korisnika umesto profila.
function Header() {
  const { userId, isAdmin } = useAuth();
  const { t } = useTranslation();
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
          <Link to={isAdmin ? "/admin" : "/pocetna"} className="app-header-logo" aria-label={isAdmin ? t('nav.admin') : t('nav.home')}>
            <img src="/images/logosajt(4).ico" alt="EventBox" />
          </Link>

          <div className="app-header-search" ref={searchRef}>
            <form onSubmit={(e) => e.preventDefault()}>
              <i className="la la-search" />
              <input
                type="text"
                name="search"
                placeholder={t('header.searchUsers')}
                aria-label={t('header.searchUsersLabel')}
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
                        {(result.firstName || result.username || "?").charAt(0)}
                      </span>
                      <span className="app-header-results-text">
                        <strong>{result.firstName} {result.lastName}</strong>
                        <small>@{result.username}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="app-header-nav" role="navigation" aria-label={t('header.mainNav')}>
          {isAdmin
            ? ADMIN_TABOVI.map((stavka) => (
                <Link
                  key={stavka.tab}
                  to={adminTabUrl(stavka.tab)}
                  title={t(stavka.labelKey)}
                  aria-current={aktivniTab === stavka.tab ? "page" : undefined}
                  className={`app-header-link ${aktivniTab === stavka.tab ? "is-active" : ""}`}
                >
                  <span className="app-header-link-icon">
                    <i className={`la ${stavka.ikona}`} />
                  </span>
                  <span className="app-header-link-label">{t(stavka.labelKey)}</span>
                </Link>
              ))
            : NAV_STAVKE.map((stavka) => (
                <NavLink
                  key={stavka.to}
                  to={stavka.to}
                  title={t(stavka.labelKey)}
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
                  <span className="app-header-link-label">{t(stavka.labelKey)}</span>
                </NavLink>
              ))}
        </div>

        <div className="app-header-right" ref={profilRef}>
          <LanguageSwitcher />
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
                  slika={isAdmin ? null : korisnik.profileImage}
                  ime={isAdmin ? t('header.administrator') : korisnik.firstName}
                />
                <span className="app-header-profile-name">{isAdmin ? t('header.administrator') : korisnik.firstName}</span>
                <i className="la la-angle-down app-header-chevron" />
              </button>

              {meniOtvoren && (
                <div className="app-header-menu" role="menu">
                  {isAdmin ? (
                    <Link to={adminTabUrl("administratori")} role="menuitem" onClick={() => setMeniOtvoren(false)}>
                      <i className="la la-user-secret" /> {t('admin.tabs.admins')}
                    </Link>
                  ) : (
                    <Link to="/profil" role="menuitem" onClick={() => setMeniOtvoren(false)}>
                      <i className="la la-user" /> {t('header.myProfile')}
                    </Link>
                  )}
                  {/* Strana za prijavu pri otvaranju poziva logout() (odjava i na serveru) */}
                  <Link to="/" role="menuitem" className="is-danger">
                    <i className="la la-sign-out" /> {t('header.logout')}
                  </Link>
                </div>
              )}
            </>
          ) : (
            <span className="app-header-profile-name">{t('header.userUnavailable')}</span>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
