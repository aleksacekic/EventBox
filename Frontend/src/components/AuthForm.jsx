import { api, ApiError } from '../api';
import { toast } from 'react-toastify';
import { useAuth } from '../auth';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthForm() {

  const { login, logout } = useAuth();
  const { t } = useTranslation();

  // Ruta sa koje je RequireAuth izbacio korisnika - vracamo ga tamo posle prijave
  const location = useLocation();
  const from = location.state?.from?.pathname || '/pocetna';

  const [activeTab, setActiveTab] = useState('tab-1'); // Podrazumevano aktivan tab je "Prijava"

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Kad se otvori login stranica, ocisti eventualnu staru sesiju
  useEffect(() => {
    logout();
  }, [logout]);


  const [errors, setErrors] = useState({});
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = t('auth.required');
      }
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const username = poljaForme.username.value;
    const password = poljaForme.password.value;


    try {
      const data = await api.post('/api/users/login', { username, password });
      if (data.error === 'INVALID_CREDENTIALS') {
        // Nije obican korisnik -> probaj kao administrator
        await tryAdminLogin(username, password);
      } else if (data.error === 'ACCOUNT_BLOCKED') {
        toast.error(t('auth.blocked'));
      } else {
        login({ token: data.token, userId: data.userId });
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Greska pri prijavi:', error);
      // 429: previse pokusaja - server kaze koliko jos treba sacekati
      toast.error(error instanceof ApiError && error.status === 429 ? error.message : t('auth.loginFailed'));
    }
  };

  const tryAdminLogin = async (username, password) => {
    try {
      const data = await api.post('/api/admins/login', { username, password });
      if (data.error) {
        toast.error(t('auth.wrongCredentials'));
      } else {
        login({ token: data.token, isAdmin: true });
        navigate('/admin', { replace: true });
      }
    } catch (error) {
      console.error('Greska pri admin prijavi:', error);
      toast.error(error instanceof ApiError && error.status === 429 ? error.message : t('auth.wrongCredentials'));
    }
  };
// -----------------------------------------------------------------------------------------------


  const handleRegister = async (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = t('auth.required');
      }
    }

    // Ista pravila kao na serveru (Backend/Models/UsernameRules.cs)
    const korisnickoime = poljaForme.username1.value.trim();
    if (!noveGreske.username1 && !/^[A-Za-z0-9._-]{3,30}$/.test(korisnickoime)) {
      isGreska = true;
      noveGreske.username1 = t('validation.username');
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const ime = poljaForme.ime.value;
    const prezime = poljaForme.prezime.value;
    const mail = poljaForme.email.value;
    const datumrodjenja = poljaForme.date.value;
    const lozinka = poljaForme.password.value;
    try {
      const odgovor = await api.post('/api/users', {
        firstName: ime,
        lastName: prezime,
        username: korisnickoime,
        password: lozinka,
        dateOfBirth: datumrodjenja,
        email: mail,
      });
      if (odgovor?.error === 'USERNAME_TAKEN') {
        toast.error(t('auth.usernameTaken'));
        return;
      }
      if (odgovor?.error === 'EMAIL_TAKEN') {
        toast.error(t('auth.emailTaken'));
        return;
      }
      if (odgovor?.error === 'INVALID_BIRTH_DATE') {
        toast.error(t('auth.invalidBirthDate'));
        return;
      }
      toast.success(t('auth.registered'));
      e.target.reset();
      setErrors({});
      setActiveTab('tab-1');
    } catch (error) {
      console.error('Greska:', error);
      // 400 sa servera nosi konkretnu poruku (npr. pravila za korisnicko ime)
      toast.error(error instanceof ApiError && (error.status === 400 || error.status === 429)
        ? error.message
        : t('auth.registerFailed'));
    }
  };


  return (
    <div className="auth-page">
        <LanguageSwitcher className="auth-lang" />
        <div className="auth-card">

          <div className="auth-info">
            <img className="auth-logo" src="/images/eb-logo-dugi2.png" alt="EventBox" />
            <p className="auth-tagline">
              {t('auth.tagline')}
            </p>
            <img className="auth-illustration" src="/images/cm-main-img.png" alt="" />
          </div>

          <div className="auth-form-panel">
            <ul className="nav auth-tabs">
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'tab-1' ? 'active' : ''}`}
                  onClick={() => handleTabClick('tab-1')}
                >
                  {t('auth.login')}
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link ${activeTab === 'tab-2' ? 'active' : ''}`}
                  onClick={() => handleTabClick('tab-2')}
                >
                  {t('auth.register')}
                </button>
              </li>
            </ul>

            <div className={`auth-pane ${activeTab === 'tab-1' ? 'is-active' : ''}`}>
              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <i className="la la-at" />
                  <input type="text" name="username" placeholder={t('auth.username')} autoComplete="off" className="auth-input" />
                </div>
                {errors.username && <span className="error-message">{errors.username}</span>}

                <div className="auth-field">
                  <i className="la la-lock" />
                  <input type="password" name="password" placeholder={t('auth.password')} autoComplete="current-password" className="auth-input" />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                <button type="submit" value="submit" className="auth-submit">{t('auth.login')}</button>
              </form>
            </div>

            <div className={`auth-pane ${activeTab === 'tab-2' ? 'is-active' : ''}`}>
              <form onSubmit={handleRegister}>
                <div className="auth-field">
                  <i className="la la-user" />
                  <input type="text" name="ime" placeholder={t('auth.firstName')} autoComplete="given-name" className="auth-input" />
                </div>
                {errors.ime && <span className="error-message">{errors.ime}</span>}

                <div className="auth-field">
                  <i className="la la-user" />
                  <input type="text" name="prezime" placeholder={t('auth.lastName')} autoComplete="family-name" className="auth-input" />
                </div>
                {errors.prezime && <span className="error-message">{errors.prezime}</span>}

                <div className="auth-field">
                  <i className="la la-at" />
                  <input type="text" name="username1" placeholder={t('auth.username')} autoComplete="off" maxLength={30} className="auth-input" />
                </div>
                {errors.username1 && <span className="error-message">{errors.username1}</span>}

                <div className="auth-field">
                  <i className="la la-mail-forward" />
                  <input type="email" name="email" placeholder={t('auth.email')} autoComplete="email" className="auth-input" />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}

                <div className="auth-field">
                  <i className="la la-calendar" />
                  <input type="date" name="date" placeholder={t('auth.birthDate')} autoComplete="bday" className="auth-input" />
                </div>
                {errors.date && <span className="error-message">{errors.date}</span>}

                <div className="auth-field">
                  <i className="la la-lock" />
                  <input type="password" name="password" placeholder={t('auth.password')} autoComplete="new-password" minLength={8} className="auth-input" />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                <button type="submit" value="submit" className="auth-submit">{t('auth.register')}</button>
              </form>
            </div>
          </div>

        </div>

        <p className="auth-copyright">
          <img src="/images/copy-icon.png" alt="" />Copyright {new Date().getFullYear()}
          <span className="auth-copyright-sep">&middot;</span>
          {t('auth.createdBy')} <a href="https://github.com/aleksacekic" target="_blank" rel="noopener noreferrer">aleksacekic</a>
        </p>
    </div>
  )
}


export default AuthForm;
