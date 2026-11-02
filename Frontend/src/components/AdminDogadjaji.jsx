import React, { useEffect, useState } from 'react';
import AdminNaslov from './AdminNaslov';
import AdminDogadjajKartica from './AdminDogadjajKartica';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';

// Admin: svi dogadjaji, i oni koji su prosli (5 po 5, skrolom), sa pretragom po nazivu.
function AdminDogadjaji() {
  const [unos, setUnos] = useState('');
  const [pretraga, setPretraga] = useState('');

  // Pretraga krece kad korisnik zastane sa kucanjem, ne na svako slovo
  useEffect(() => {
    const tajmer = setTimeout(() => setPretraga(unos.trim()), 300);
    return () => clearTimeout(tajmer);
  }, [unos]);

  const putanja = pretraga
    ? `/Dogadjaj/VratiSveDogadjaje?naziv=${encodeURIComponent(pretraga)}`
    : '/Dogadjaj/VratiSveDogadjaje';
  const lista = useBeskonacnaLista(putanja, { limit: 5 });

  const obrisan = (id) => {
    lista.setStavke((prev) => prev.filter((d) => d.id !== id));
    lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
  };

  return (
    <section>
      <AdminNaslov
        ikona="la-calendar"
        naslov="Svi dogadjaji"
        opis="Svi objavljeni dogadjaji, i predstojeci i zavrseni. Najnoviji su prvi."
        broj={lista.ukupno}
      >
        <div className="admin-pretraga">
          <i className="la la-search" />
          <input
            type="search"
            placeholder="Pretrazi po nazivu..."
            aria-label="Pretrazi dogadjaje po nazivu"
            value={unos}
            onChange={(e) => setUnos(e.target.value)}
          />
        </div>
      </AdminNaslov>

      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-calendar-o" />
          {pretraga ? `Nema dogadjaja ciji naziv sadrzi "${pretraga}".` : 'Jos nema nijednog dogadjaja.'}
        </div>
      )}

      {lista.stavke.map((d) => (
        <AdminDogadjajKartica key={d.id} dogadjaj={d} onObrisan={obrisan} />
      ))}
      <KrajListe lista={lista} />
    </section>
  );
}

export default AdminDogadjaji;
