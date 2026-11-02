import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import AdminNaslov from './AdminNaslov';

const PRAZNA_FORMA = { ime: '', prezime: '', emailAdresa: '', korisnickoIme: '', lozinka: '', lozinka2: '' };

// Admin: lista administratora, dodavanje novog i brisanje. Server ne dozvoljava brisanje
// sopstvenog naloga ni poslednjeg administratora (dugme se tada i ne nudi).
function AdminAdministratori() {
  const [admini, setAdmini] = useState(null);
  const [greska, setGreska] = useState(false);
  const [formaOtvorena, setFormaOtvorena] = useState(false);
  const [forma, setForma] = useState(PRAZNA_FORMA);
  const [greskaForme, setGreskaForme] = useState('');
  const [salje, setSalje] = useState(false);
  const [brise, setBrise] = useState(null);

  const ucitaj = useCallback(async () => {
    try {
      setAdmini(await api.get('/Administrator/VratiAdministratore'));
      setGreska(false);
    } catch (error) {
      console.error('Ucitavanje administratora nije uspelo:', error);
      setGreska(true);
    }
  }, []);

  useEffect(() => {
    ucitaj();
  }, [ucitaj]);

  const polje = (ime) => ({
    name: ime,
    value: forma[ime],
    onChange: (e) => setForma((f) => ({ ...f, [ime]: e.target.value })),
  });

  const zatvoriFormu = () => {
    setFormaOtvorena(false);
    setForma(PRAZNA_FORMA);
    setGreskaForme('');
  };

  const dodaj = async (e) => {
    e.preventDefault();
    setGreskaForme('');
    if (forma.lozinka.length < 8) {
      setGreskaForme('Lozinka mora imati najmanje 8 karaktera.');
      return;
    }
    if (forma.lozinka !== forma.lozinka2) {
      setGreskaForme('Lozinke se ne poklapaju.');
      return;
    }
    setSalje(true);
    try {
      const { ime, prezime, emailAdresa, korisnickoIme, lozinka } = forma; // bez ponovljene lozinke
      const novi = await api.post('/Administrator/DodajAdministratora', { ime, prezime, emailAdresa, korisnickoIme, lozinka });
      setAdmini((prev) => [...(prev ?? []), novi]);
      zatvoriFormu();
      toast.success(`Administrator @${novi.korisnicko_ime} je dodat.`);
    } catch (error) {
      // Server vraca razlog (npr. zauzeto korisnicko ime, neispravan email)
      setGreskaForme(error.message || 'Dodavanje nije uspelo. Pokusajte ponovo.');
    } finally {
      setSalje(false);
    }
  };

  const obrisi = async (a) => {
    if (brise || !window.confirm(`Obrisati administratora @${a.korisnicko_ime}? Vise nece moci da se prijavi.`)) return;
    setBrise(a.id);
    try {
      await api.del(`/Administrator/IzbrisiAdministratora/${a.id}`);
      setAdmini((prev) => prev.filter((x) => x.id !== a.id));
      toast.success(`Administrator @${a.korisnicko_ime} je obrisan.`);
    } catch (error) {
      console.error('Brisanje administratora nije uspelo:', error);
      toast.error(error.message || 'Brisanje nije uspelo. Pokusajte ponovo.');
    } finally {
      setBrise(null);
    }
  };

  return (
    <section>
      <AdminNaslov
        ikona="la-user-secret"
        naslov="Administratori"
        opis="Nalozi sa pristupom ovoj stranici. Novi administrator se prijavljuje na istoj strani kao i korisnici."
        broj={admini?.length}
      >
        {!formaOtvorena && (
          <button type="button" className="admin-dodaj" onClick={() => setFormaOtvorena(true)}>
            <i className="la la-user-plus" /> Dodaj administratora
          </button>
        )}
      </AdminNaslov>

      {formaOtvorena && (
        <form className="admin-forma" onSubmit={dodaj} autoComplete="off">
          <h3>Novi administrator</h3>
          <div className="admin-forma-polja">
            <label>Ime<input {...polje('ime')} required maxLength={50} autoFocus /></label>
            <label>Prezime<input {...polje('prezime')} required maxLength={50} /></label>
            <label>Email<input type="email" {...polje('emailAdresa')} required maxLength={254} /></label>
            <label>Korisnicko ime<input {...polje('korisnickoIme')} required minLength={3} maxLength={30} autoComplete="off" /></label>
            <label>Lozinka<input type="password" {...polje('lozinka')} required minLength={8} autoComplete="new-password" /></label>
            <label>Ponovi lozinku<input type="password" {...polje('lozinka2')} required minLength={8} autoComplete="new-password" /></label>
          </div>
          {greskaForme && <p className="admin-forma-greska" role="alert">{greskaForme}</p>}
          <div className="admin-forma-dugmad">
            <button type="button" className="admin-forma-otkazi" onClick={zatvoriFormu}>Otkazi</button>
            <button type="submit" className="admin-dodaj" disabled={salje}>
              {salje ? 'Dodajem...' : 'Dodaj'}
            </button>
          </div>
        </form>
      )}

      {greska && (
        <div className="lista-greska">
          Ucitavanje nije uspelo.{' '}
          <button type="button" onClick={ucitaj}>Pokusaj ponovo</button>
        </div>
      )}

      <div className="blokirani">
        {admini?.map((a) => (
          <div className="blokirani-red" key={a.id}>
            <Avatar className="blokirani-avatar" ime={a.ime} />
            <div className="blokirani-tekst">
              <strong>
                {a.ime} {a.prezime}
                {a.ja && <span className="admin-status is-aktivan admin-ja">Vi</span>}
              </strong>
              <small>@{a.korisnicko_ime} · {a.email_adresa}</small>
            </div>
            {!a.ja && admini.length > 1 && (
              <button
                type="button"
                className="blokirani-dugme is-danger"
                onClick={() => obrisi(a)}
                disabled={brise === a.id}
              >
                Obrisi
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default AdminAdministratori;
