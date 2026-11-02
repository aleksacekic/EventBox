import React, { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';

// Izmena podataka svog naloga i brisanje naloga (tab "Informacije" na svom profilu).
// Iste provere kao na serveru (UsersController.UpdateCurrentUser) - greske sa servera
// stizu kao { greske: { polje: poruka } } i prikazuju se ispod tog polja.
function EditProfileForm({ korisnik, onSaved, onCancel }) {
  const { userId, logout } = useAuth();
  const navigate = useNavigate();

  const [polja, setPolja] = useState({
    ime: korisnik.ime ?? '',
    prezime: korisnik.prezime ?? '',
    korisnickoIme: korisnik.korisnicko_Ime ?? '',
    emailAdresa: korisnik.email_Adresa ?? '',
    datumRodjenja: korisnik.datum_rodjenja ? format(new Date(korisnik.datum_rodjenja), 'yyyy-MM-dd') : '',
  });
  const [menjaLozinku, setMenjaLozinku] = useState(false);
  const [lozinke, setLozinke] = useState({ trenutnaLozinka: '', lozinka: '', ponovo: '' });
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
    if (!polja.ime.trim()) g.ime = 'Unesite ime.';
    if (!polja.prezime.trim()) g.prezime = 'Unesite prezime.';
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(polja.korisnickoIme.trim()))
      g.korisnickoIme = 'Od 3 do 30 karaktera: slova bez kvačica, cifre, tačka, crta i donja crta.';
    if (!/^\S+@\S+\.\S+$/.test(polja.emailAdresa.trim())) g.emailAdresa = 'Unesite ispravnu email adresu.';
    if (!polja.datumRodjenja) g.datumRodjenja = 'Unesite datum rodjenja.';
    if (menjaLozinku) {
      if (!lozinke.trenutnaLozinka) g.trenutnaLozinka = 'Unesite trenutnu lozinku.';
      if (lozinke.lozinka.length < 8) g.lozinka = 'Nova lozinka mora imati najmanje 8 karaktera.';
      else if (lozinke.lozinka !== lozinke.ponovo) g.ponovo = 'Lozinke se ne poklapaju.';
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
        ime: polja.ime.trim(),
        prezime: polja.prezime.trim(),
        korisnickoIme: polja.korisnickoIme.trim(),
        emailAdresa: polja.emailAdresa.trim(),
        datumRodjenja: polja.datumRodjenja,
        ...(menjaLozinku ? { lozinka: lozinke.lozinka, trenutnaLozinka: lozinke.trenutnaLozinka } : {}),
      });
      onSaved(novi);
    } catch (error) {
      if (error instanceof ApiError && error.data?.greske) setGreske(error.data.greske);
      else setGreske({ opste: error instanceof ApiError && error.status === 429 ? error.message : 'Cuvanje nije uspelo. Pokusajte ponovo.' });
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
      await api.del(`/api/users/${userId}`, { body: { lozinka: lozinkaZaBrisanje } });
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      setGreskaBrisanja(error instanceof ApiError && (error.status === 400 || error.status === 429)
        ? error.message
        : 'Brisanje nije uspelo. Pokusajte ponovo.');
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
          {renderField('Ime', 'ime', 'text', { maxLength: 50, autoComplete: 'given-name' })}
          {renderField('Prezime', 'prezime', 'text', { maxLength: 50, autoComplete: 'family-name' })}
        </div>
        <div className="create-event-row">
          {renderField('Korisnicko ime', 'korisnickoIme', 'text', { maxLength: 30, autoComplete: 'username' })}
          {renderField('Datum rodjenja', 'datumRodjenja', 'date', { max: format(new Date(), 'yyyy-MM-dd'), min: '1900-01-01' })}
        </div>
        {renderField('Email', 'emailAdresa', 'email', { maxLength: 254, autoComplete: 'email' })}

        <label className="izmena-profila-check">
          <input type="checkbox" checked={menjaLozinku} onChange={(e) => setMenjaLozinku(e.target.checked)} />
          Promeni lozinku
        </label>
        {menjaLozinku && (
          <>
            {renderPasswordField('Trenutna lozinka', 'trenutnaLozinka', 'current-password')}
            <div className="create-event-row">
              {renderPasswordField('Nova lozinka', 'lozinka', 'new-password')}
              {renderPasswordField('Ponovite novu lozinku', 'ponovo', 'new-password')}
            </div>
          </>
        )}

        {greske.opste && <span className="create-event-error">{greske.opste}</span>}
        <div className="create-event-actions">
          <button type="submit" className="create-event-submit" disabled={salje}>
            {salje ? 'Cuvam...' : 'Sacuvaj'}
          </button>
          <button type="button" className="create-event-cancel" onClick={onCancel}>Otkazi</button>
        </div>
      </form>

      <div className="izmena-profila-opasno">
        <h4>Brisanje naloga</h4>
        <p>Brisu se nalog, svi vasi dogadjaji, komentari, reakcije i poruke. Ovo se ne moze vratiti.</p>
        {!brisanjeOtvoreno ? (
          <button type="button" className="izmena-profila-obrisi" onClick={() => setBrisanjeOtvoreno(true)}>
            Obrisi nalog
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="create-event-form">
            <div className="create-event-field">
              <label htmlFor="ip-brisanje">Potvrdite lozinkom</label>
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
                {brise ? 'Brisem...' : 'Trajno obrisi nalog'}
              </button>
              <button type="button" className="create-event-cancel" onClick={() => { setBrisanjeOtvoreno(false); setLozinkaZaBrisanje(''); setGreskaBrisanja(''); }}>
                Otkazi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditProfileForm;
