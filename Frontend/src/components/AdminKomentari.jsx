import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import { formatTrenutak } from '../utils/datum';
import { adminKorisnikUrl } from '../utils/admin';

// Admin: komentari jednog dogadjaja (najnoviji prvi, 10 po 10) i brisanje bilo kog komentara.
// Administrator vidi i komentare blokiranih korisnika (korisnicima su sakriveni), sa oznakom.
function AdminKomentari({ dogadjajId }) {
  const lista = useBeskonacnaLista(`/Komentar/VratiKomentare/${dogadjajId}`, { limit: 10 });
  const [brise, setBrise] = useState(null);

  const obrisi = async (k) => {
    if (brise || !window.confirm(`Obrisati komentar korisnika @${k.username_korisnika}?`)) return;
    setBrise(k.id);
    try {
      await api.del(`/Komentar/IzbrisiKomentar/${k.id}`);
      lista.setStavke((prev) => prev.filter((x) => x.id !== k.id));
      lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
      toast.success('Komentar je obrisan.');
    } catch (error) {
      console.error('Brisanje komentara nije uspelo:', error);
      toast.error('Brisanje komentara nije uspelo. Pokusajte ponovo.');
    } finally {
      setBrise(null);
    }
  };

  return (
    <div className="admin-komentari">
      <div className="admin-panel-naslov">
        Komentari{lista.ukupno != null && <span className="admin-broj">{lista.ukupno}</span>}
      </div>

      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <p className="admin-komentari-prazno">Nema komentara.</p>
      )}

      <ul>
        {lista.stavke.map((k) => (
          <li key={k.id} className="admin-komentar">
            <Avatar className="komentar-avatar" slika={k.slikaKorisnika} ime={k.username_korisnika} />
            <div className="admin-komentar-sadrzaj">
              <div className="admin-komentar-red">
                <Link to={adminKorisnikUrl(k.autorId)} className="admin-komentar-autor">@{k.username_korisnika}</Link>
                {k.autorBlokiran && <span className="admin-status is-blokiran">Blokiran</span>}
                <span className="admin-komentar-vreme">{formatTrenutak(k.vreme)}</span>
              </div>
              <p>{k.tekst}</p>
            </div>
            <button
              type="button"
              className="admin-komentar-obrisi"
              onClick={() => obrisi(k)}
              disabled={brise === k.id}
              title="Obrisi komentar"
              aria-label={`Obrisi komentar korisnika @${k.username_korisnika}`}
            >
              <i className="la la-trash" />
            </button>
          </li>
        ))}
      </ul>
      <KrajListe lista={lista} />
    </div>
  );
}

export default AdminKomentari;
