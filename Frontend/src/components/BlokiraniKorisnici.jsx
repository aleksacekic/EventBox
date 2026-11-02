import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import AdminNaslov from './AdminNaslov';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import { adminKorisnikUrl } from '../utils/admin';

// Admin: lista blokiranih korisnika (20 po 20, skrolom) i odblokiranje.
// Klik na korisnika otvara admin pregled korisnika.
function BlokiraniKorisnici() {
  const lista = useBeskonacnaLista('/Korisnik/VratiBlokirane', { limit: 20 });

  const odblokiraj = async (k) => {
    if (!window.confirm(`Odblokirati korisnika @${k.korisnicko_Ime}? Ponovo ce moci da se prijavi.`)) return;
    try {
      await api.put(`/Korisnik/OdblokirajKorisnika/${k.id}`);
      lista.setStavke((prev) => prev.filter((x) => x.id !== k.id));
      lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
      toast.success(`Korisnik @${k.korisnicko_Ime} je odblokiran.`);
    } catch (error) {
      console.error('Odblokiranje nije uspelo:', error);
      toast.error('Odblokiranje nije uspelo. Pokusajte ponovo.');
    }
  };

  return (
    <section>
      <AdminNaslov
        ikona="la-ban"
        naslov="Blokirani korisnici"
        opis="Blokiran korisnik ne moze da se prijavi. Klik na korisnika otvara njegov pregled."
        broj={lista.ukupno}
      />

      <div className="blokirani">
        {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
          <div className="profil-empty admin-prazno">
            <i className="la la-smile-o" />
            Nema blokiranih korisnika.
          </div>
        )}
        {lista.stavke.map((k) => (
          <div className="blokirani-red" key={k.id}>
            <Link to={adminKorisnikUrl(k.id)} className="blokirani-link">
              <Avatar className="blokirani-avatar" slika={k.korisnikImage} ime={k.ime} />
              <div className="blokirani-tekst">
                <strong>{k.ime} {k.prezime}</strong>
                <small>@{k.korisnicko_Ime} · {k.email_Adresa}</small>
              </div>
            </Link>
            <button type="button" className="blokirani-dugme" onClick={() => odblokiraj(k)}>
              Odblokiraj
            </button>
          </div>
        ))}
        <KrajListe lista={lista} />
      </div>
    </section>
  );
}

export default BlokiraniKorisnici;
