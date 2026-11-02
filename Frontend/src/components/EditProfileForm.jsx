import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { useTranslation } from 'react-i18next';

// Izmena podataka svog naloga i brisanje naloga (tab "Informacije" na svom profilu).
// Iste provere kao na serveru (UsersController.UpdateCurrentUser). Kljucevi polja su isti kao
// na serveru, pa greske sa servera ({ errors: { polje: poruka } }) idu ispod pravog polja.
function EditProfileForm({ korisnik, onSaved, onCancel }) {
  const { userId, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [polja, setPolja] = useState({
    firstName: korisnik.firstName ?? '',
    lastName: korisnik.lastName ?? '',
    username: korisnik.username ?? '',
    email: korisnik.email ?? '',
    dateOfBirth: korisnik.dateOfBirth ? format(new Date(korisnik.dateOfBirth), 'yyyy-MM-dd') : '',
  });
  const [menjaLozinku, setMenjaLozinku] = useState(false);
  const [lozinke, setLozinke] = useState({ currentPassword: '', password: '', repeatPassword: '' });
  const [greske, setGreske] = useState({});
  const [salje, setSalje] = useState(false);

  const [brisanjeOtvoreno, setBrisanjeOtvoreno] = useState(false);
  const [lozinkaZaBrisanje, setLozinkaZaBrisanje] = useState('');
  const [greskaBrisanja, setGreskaBrisanja] = useState('');
  const [brise, setBrise] = useState(false);

  const handleFieldChange = (polje) => (e) => setPolja((p) => ({ ...p, [polje]: e.target.value }));
  const handlePasswordChange = (polje) => (e) => setLozinke((p) => ({ ...p, [polje]: e.target.value }));

  const validate = () => {
    const g = {};
    if (!polja.firstName.trim()) g.firstName = t('validation.firstName');
    if (!polja.lastName.trim()) g.lastName = t('validation.lastName');
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(polja.username.trim())) g.username = t('validation.username');
    if (!/^\S+@\S+\.\S+$/.test(polja.email.trim())) g.email = t('validation.email');
    if (!polja.dateOfBirth) g.dateOfBirth = t('validation.birthDate');
    if (menjaLozinku) {
      if (!lozinke.currentPassword) g.currentPassword = t('validation.currentPassword');
      if (lozinke.password.length < 8) g.password = t('validation.newPasswordLength');
      else if (lozinke.password !== lozinke.repeatPassword) g.repeatPassword = t('validation.passwordsMismatch');
    }
    return g;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const g = validate();
    setGreske(g);
    if (Object.keys(g).length > 0 || salje) return;
    setSalje(true);
    try {
      const novi = await api.put('/api/users/me', {
        firstName: polja.firstName.trim(),
        lastName: polja.lastName.trim(),
        username: polja.username.trim(),
        email: polja.email.trim(),
        dateOfBirth: polja.dateOfBirth,
        ...(menjaLozinku ? { password: lozinke.password, currentPassword: lozinke.currentPassword } : {}),
      });
      onSaved(novi);
    } catch (error) {
      if (error instanceof ApiError && error.data?.errors) setGreske(error.data.errors);
      else setGreske({ general: error instanceof ApiError && error.status === 429 ? error.message : t('editProfile.saveFailed') });
    } finally {
      setSalje(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!lozinkaZaBrisanje || brise) return;
    setBrise(true);
    setGreskaBrisanja('');
    try {
      await api.del(`/api/users/${userId}`, { body: { password: lozinkaZaBrisanje } });
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      setGreskaBrisanja(error instanceof ApiError && (error.status === 400 || error.status === 429)
        ? error.message
        : t('editProfile.deleteFailed'));
      setBrise(false);
    }
  };

  const renderField = (naziv, kljuc, tip = 'text', extra = {}) => (
    <div className="create-event-field">
      <label htmlFor={`ip-${kljuc}`}>{naziv}</label>
      <input
        id={`ip-${kljuc}`}
        type={tip}
        className={`create-event-input ${greske[kljuc] ? 'create-event-input-invalid' : ''}`}
        value={polja[kljuc]}
        onChange={handleFieldChange(kljuc)}
        {...extra}
      />
      {greske[kljuc] && <span className="create-event-error">{greske[kljuc]}</span>}
    </div>
  );

  const renderPasswordField = (naziv, kljuc, autoComplete) => (
    <div className="create-event-field">
      <label htmlFor={`ip-${kljuc}`}>{naziv}</label>
      <input
        id={`ip-${kljuc}`}
        type="password"
        autoComplete={autoComplete}
        className={`create-event-input ${greske[kljuc] ? 'create-event-input-invalid' : ''}`}
        value={lozinke[kljuc]}
        onChange={handlePasswordChange(kljuc)}
      />
      {greske[kljuc] && <span className="create-event-error">{greske[kljuc]}</span>}
    </div>
  );

  return (
    <div className="izmena-profila">
      <form onSubmit={handleSave} className="create-event-form" noValidate>
        <div className="create-event-row">
          {renderField(t('editProfile.firstName'), 'firstName', 'text', { maxLength: 50, autoComplete: 'given-name' })}
          {renderField(t('editProfile.lastName'), 'lastName', 'text', { maxLength: 50, autoComplete: 'family-name' })}
        </div>
        <div className="create-event-row">
          {renderField(t('editProfile.username'), 'username', 'text', { maxLength: 30, autoComplete: 'username' })}
          {renderField(t('editProfile.birthDate'), 'dateOfBirth', 'date', { max: format(new Date(), 'yyyy-MM-dd'), min: '1900-01-01' })}
        </div>
        {renderField(t('editProfile.email'), 'email', 'email', { maxLength: 254, autoComplete: 'email' })}

        <label className="izmena-profila-check">
          <input type="checkbox" checked={menjaLozinku} onChange={(e) => setMenjaLozinku(e.target.checked)} />
          {t('editProfile.changePassword')}
        </label>
        {menjaLozinku && (
          <>
            {renderPasswordField(t('editProfile.currentPassword'), 'currentPassword', 'current-password')}
            <div className="create-event-row">
              {renderPasswordField(t('editProfile.newPassword'), 'password', 'new-password')}
              {renderPasswordField(t('editProfile.repeatPassword'), 'repeatPassword', 'new-password')}
            </div>
          </>
        )}

        {greske.general && <span className="create-event-error">{greske.general}</span>}
        <div className="create-event-actions">
          <button type="submit" className="create-event-submit" disabled={salje}>
            {salje ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" className="create-event-cancel" onClick={onCancel}>{t('common.cancel')}</button>
        </div>
      </form>

      <div className="izmena-profila-opasno">
        <h4>{t('editProfile.deleteTitle')}</h4>
        <p>{t('editProfile.deleteWarning')}</p>
        {!brisanjeOtvoreno ? (
          <button type="button" className="izmena-profila-obrisi" onClick={() => setBrisanjeOtvoreno(true)}>
            {t('editProfile.deleteAccount')}
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="create-event-form">
            <div className="create-event-field">
              <label htmlFor="ip-brisanje">{t('editProfile.confirmWithPassword')}</label>
              <input
                id="ip-brisanje"
                type="password"
                autoComplete="current-password"
                className={`create-event-input ${greskaBrisanja ? 'create-event-input-invalid' : ''}`}
                value={lozinkaZaBrisanje}
                onChange={(e) => setLozinkaZaBrisanje(e.target.value)}
                autoFocus
              />
              {greskaBrisanja && <span className="create-event-error">{greskaBrisanja}</span>}
            </div>
            <div className="create-event-actions">
              <button type="submit" className="izmena-profila-obrisi" disabled={!lozinkaZaBrisanje || brise}>
                {brise ? t('editProfile.deleting') : t('editProfile.deleteForever')}
              </button>
              <button type="button" className="create-event-cancel" onClick={() => { setBrisanjeOtvoreno(false); setLozinkaZaBrisanje(''); setGreskaBrisanja(''); }}>
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditProfileForm;
