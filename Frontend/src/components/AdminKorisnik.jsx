import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import AdminDogadjajKartica from './AdminDogadjajKartica';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import { formatDatum } from '../utils/datum';
import { adminTabUrl, brojSaImenicom } from '../utils/admin';

// Admin: pregled jednog korisnika (/admin?korisnik=ID) - podaci, status naloga,
// blokiranje/odblokiranje i svi njegovi dogadjaji.
function AdminKorisnik({ id }) {
  const navigate = useNavigate();
  const [k, setK] = useState(null);
  const [greska, setGreska] = useState(null);
  const [radi, setRadi] = useState(false);
  const lista = useBeskonacnaLista(`/Korisnik/VratiDogadjajeKorisnika/${id}`, { limit: 5 });

  useEffect(() => {
    let vazi = true;
    setK(null);
    setGreska(null);
    api.get(`/Korisnik/VratiKorisnikaAdmin/${id}`)
      .then((data) => vazi && setK(data))
      .catch((error) => vazi && setGreska(error));
    return () => { vazi = false; };
  }, [id]);

  // Nazad na prethodnu stranu, a ako je pregled otvoren direktnim linkom - na prijave
  const nazad = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(adminTabUrl('prijave'));
  };

  const promeniBlokadu = async () => {
    const blokiraj = !k.blokiran;
    const pitanje = blokiraj
      ? `Blokirati korisnika @${k.korisnicko_Ime}? Odmah ce biti odjavljen i nece moci da se prijavi.`
      : `Odblokirati korisnika @${k.korisnicko_Ime}? Ponovo ce moci da se prijavi.`;
    if (radi || !window.confirm(pitanje)) return;
    setRadi(true);
    try {
      await api.put(`/Korisnik/${blokiraj ? 'Blokiraj' : 'Odblokiraj'}Korisnika/${k.id}`);
      setK((prev) => ({ ...prev, blokiran: blokiraj }));
      toast.success(`Korisnik @${k.korisnicko_Ime} je ${blokiraj ? 'blokiran' : 'odblokiran'}.`);
    } catch (error) {
      console.error('Promena blokade nije uspela:', error);
      toast.error('Akcija nije uspela. Pokusajte ponovo.');
    } finally {
      setRadi(false);
    }
  };

  const obrisan = (dogadjajId) => {
    lista.setStavke((prev) => prev.filter((d) => d.id !== dogadjajId));
    lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
  };

  const dugmeNazad = (
    <button type="button" className="admin-nazad" onClick={nazad}>
      <i className="la la-arrow-left" /> Nazad
    </button>
  );

  if (greska) {
    return (
      <section>
        {dugmeNazad}
        <div className="profil-empty admin-prazno">
          <i className="la la-user-times" />
          {greska.status === 404 ? 'Korisnik ne postoji (mozda je obrisao nalog).' : 'Ucitavanje korisnika nije uspelo.'}
        </div>
      </section>
    );
  }

  return (
    <section>
      {dugmeNazad}

      <div className="admin-korisnik">
        {k ? (
          <>
            <Avatar className="admin-korisnik-avatar" slika={k.korisnikImage} ime={k.ime} />
            <div className="admin-korisnik-info">
              <h2>
                {k.ime} {k.prezime}
                <span className={`admin-status ${k.blokiran ? 'is-blokiran' : 'is-aktivan'}`}>
                  {k.blokiran ? 'Blokiran' : 'Aktivan'}
                </span>
              </h2>
              <div className="admin-korisnik-korisnicko">@{k.korisnicko_Ime}</div>
              <div className="admin-korisnik-detalji">
                <span><i className="la la-envelope" /> {k.email_Adresa}</span>
                <span><i className="la la-birthday-cake" /> {formatDatum(k.datum_rodjenja)}.</span>
                <span><i className="la la-calendar" /> {brojSaImenicom(lista.ukupno ?? k.brojDogadjaja, ['dogadjaj', 'dogadjaja', 'dogadjaja'])}</span>
                <span className={k.brojPrijava > 0 ? 'admin-korisnik-prijave' : undefined}>
                  <i className="la la-flag" />{' '}
                  {k.brojPrijava > 0 ? `Prijavljen ${brojSaImenicom(k.brojPrijava, ['put', 'puta', 'puta'])}` : 'Bez prijava'}
                </span>
              </div>
              {k.blokiran && (
                <p className="admin-skriveno">
                  <i className="la la-eye-slash" /> Njegovi dogadjaji i komentari su sakriveni za ostale korisnike.
                </p>
              )}
            </div>
            <button
              type="button"
              className={`admin-dugme ${k.blokiran ? 'is-odblokiraj' : ''}`}
              onClick={promeniBlokadu}
              disabled={radi}
            >
              <i className={`la ${k.blokiran ? 'la-unlock' : 'la-ban'}`} />
              {k.blokiran ? 'Odblokiraj' : 'Blokiraj'}
            </button>
          </>
        ) : (
          <div className="admin-korisnik-ucitava">Ucitavam...</div>
        )}
      </div>

      <h3 className="admin-podnaslov">
        Dogadjaji korisnika
        {lista.ukupno != null && <span className="admin-broj">{lista.ukupno}</span>}
      </h3>

      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-calendar-o" />
          Korisnik nema nijedan dogadjaj.
        </div>
      )}

      {lista.stavke.map((d) => (
        <AdminDogadjajKartica key={d.id} dogadjaj={d} prikaziAutora={false} onObrisan={obrisan} />
      ))}
      <KrajListe lista={lista} />
    </section>
  );
}

export default AdminKorisnik;
