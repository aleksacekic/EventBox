import { api } from '../api';
import { useAuth } from '../auth';

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginRegistracijaKomponenta() {

  const { login, logout } = useAuth();

  // Ruta sa koje je RequireAuth izbacio korisnika - vracamo ga tamo posle prijave
  const location = useLocation();
  const from = location.state?.from?.pathname || '/pocetna';

  const [activeTab, setActiveTab] = useState('tab-1'); // Podrazumevano aktivan tab je "Prijava"

  const handleClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Kad se otvori login stranica, ocisti eventualnu staru sesiju
  useEffect(() => {
    logout();
  }, [logout]);


  const [errors, setErrors] = useState({});
  const navigate = useNavigate();


  const handleSubmit1 = async (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = 'Polje je obavezno.';
      }
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const username = poljaForme.username.value;
    const password = poljaForme.password.value;


    try {
      const data = await api.get(`/Korisnik/LogovanjeKorisnik/${username}/${password}`);
      if (data.nema !== undefined) {
        // Nije obican korisnik -> probaj kao administrator
        await probajAdmin(username, password);
      } else if (data.blokiran !== undefined) {
        alert("Vas nalog je blokiran");
      } else {
        login({ token: data.token, userId: data.userID });
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Greska pri prijavi:', error);
      alert('Prijava nije uspela.');
    }
  };

  const probajAdmin = async (username, password) => {
    try {
      const data = await api.get(`/Administrator/LogovanjeAdministrator/${username}/${password}`);
      if (data.nema !== undefined) {
        alert("Pogresan unos!");
      } else {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Greska pri admin prijavi:', error);
      alert("Pogresan unos!");
    }
  };
// -----------------------------------------------------------------------------------------------


  const handleSubmit2 = async (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = 'Polje je obavezno.';
      }
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const ime = poljaForme.ime.value;
    const prezime = poljaForme.prezime.value;
    const korisnickoime = poljaForme.username1.value;
    const mail = encodeURIComponent(poljaForme.email.value);
    const datumrodjenja = poljaForme.date.value;
    const lozinka = poljaForme.password.value;
    try {
      await api.post(`/Korisnik/DodajKorisnika/${ime}/${prezime}/${korisnickoime}/${lozinka}/${datumrodjenja}/${mail}`);
      alert("Uspesno ste registrovani!");
      window.location.reload();
    } catch (error) {
      console.error('Greska:', error);
      alert('Došlo je do greške prilikom registracije.');
    }
  };


  return (
    <div className="auth-page">
        <div className="auth-card">

          <div className="auth-info">
            <img className="auth-logo" src="/images/eb-logo-dugi2.png" alt="EventBox" />
            <p className="auth-tagline">
              Eventbox je inovativna društvena mreža koja predstavlja jedinstveno mesto za povezivanje ljudi koji žele da organizuju i učestvuju u raznovrsnim događajima.
            </p>
            <img className="auth-illustration" src="/images/cm-main-img.png" alt="" />
          </div>

          <div className="auth-form-panel">
            <ul className="nav auth-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'tab-1' ? 'active' : ''}`}
                  onClick={() => handleClick('tab-1')}
                >
                  Prijava
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'tab-2' ? 'active' : ''}`}
                  onClick={() => handleClick('tab-2')}
                >
                  Registracija
                </button>
              </li>
            </ul>

            <div className={`auth-pane ${activeTab === 'tab-1' ? 'is-active' : ''}`}>
              <form onSubmit={handleSubmit1}>
                <div className="auth-field">
                  <i className="la la-at" />
                  <input type="text" name="username" placeholder="Korisnicko ime" autoComplete="off" className="auth-input" />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}

                <div className="auth-field">
                  <i className="la la-lock" />
                  <input type="password" name="password" placeholder="Password" className="auth-input" />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                <button type="submit" value="submit" className="auth-submit">Prijava</button>
              </form>
            </div>

            <div className={`auth-pane ${activeTab === 'tab-2' ? 'is-active' : ''}`}>
              <form onSubmit={handleSubmit2}>
                <div className="auth-field">
                  <i className="la la-user" />
                  <input type="text" name="ime" placeholder="Ime" autoComplete="off" className="auth-input" />
                </div>
                {errors.ime && <span className="error-message">{errors.ime}</span>}

                <div className="auth-field">
                  <i className="la la-user" />
                  <input type="text" name="prezime" placeholder="Prezime" autoComplete="off" className="auth-input" />
                </div>
                {errors.prezime && <span className="error-message">{errors.prezime}</span>}

                <div className="auth-field">
                  <i className="la la-at" />
                  <input type="text" name="username1" placeholder="Korisnicko ime" autoComplete="off" className="auth-input" />
                </div>
                {errors.username1 && <span className="error-message">{errors.username1}</span>}

                <div className="auth-field">
                  <i className="la la-mail-forward" />
                  <input type="email" name="email" placeholder="Mail adresa" autoComplete="off" className="auth-input" />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}

                <div className="auth-field">
                  <i className="la la-calendar" />
                  <input type="date" name="date" placeholder="Datum rodjenja" autoComplete="off" className="auth-input" />
                </div>
                {errors.date && <span className="error-message">{errors.date}</span>}

                <div className="auth-field">
                  <i className="la la-lock" />
                  <input type="password" name="password" placeholder="Lozinka" className="auth-input" />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                <button type="submit" value="submit" className="auth-submit">Registruj se</button>
              </form>
            </div>
          </div>

        </div>

        <p className="auth-copyright">
          <img src="/images/copy-icon.png" alt="" />Copyright {new Date().getFullYear()}
          <span className="auth-copyright-sep">&middot;</span>
          Created by <a href="https://github.com/aleksacekic" target="_blank" rel="noopener noreferrer">aleksacekic</a>
        </p>
    </div>
  )
}


export default LoginRegistracijaKomponenta;
