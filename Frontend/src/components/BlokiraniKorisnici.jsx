import React from 'react';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';

// Admin: lista blokiranih korisnika (20 po 20, skrolom) i odblokiranje.
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
    <div className="blokirani">
      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <div className="profil-empty">Nema blokiranih korisnika.</div>
      )}
      {lista.stavke.map((k) => (
        <div className="blokirani-red" key={k.id}>
          <Avatar className="blokirani-avatar" slika={k.korisnikImage} ime={k.ime} />
          <div className="blokirani-tekst">
            <strong>{k.ime} {k.prezime}</strong>
            <small>@{k.korisnicko_Ime} · {k.email_Adresa}</small>
          </div>
          <button type="button" className="blokirani-dugme" onClick={() => odblokiraj(k)}>
            Odblokiraj
          </button>
        </div>
      ))}
      <KrajListe lista={lista} />
    </div>
  );
}

export default BlokiraniKorisnici;
