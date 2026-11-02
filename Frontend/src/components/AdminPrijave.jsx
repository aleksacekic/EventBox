import React from 'react';
import AdminNaslov from './AdminNaslov';
import AdminDogadjajKartica from './AdminDogadjajKartica';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';

// Admin: prijavljeni dogadjaji (5 po 5, skrolom). Prijava nestaje iz liste kad se
// dogadjaj obrise ili kad se prijava odbaci.
function AdminPrijave() {
  const lista = useBeskonacnaLista('/Pr_dog/VratiPrijavljene_dog', { limit: 5 });

  const ukloni = (prijavaId) => {
    lista.setStavke((prev) => prev.filter((p) => p.id !== prijavaId));
    lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
  };

  return (
    <section>
      <AdminNaslov
        ikona="la-flag"
        naslov="Prijavljeni dogadjaji"
        opis="Pregledaj razloge, pa obrisi dogadjaj, blokiraj autora ili odbaci prijavu."
        broj={lista.ukupno}
      />

      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-check-circle" />
          Nema prijavljenih dogadjaja.
        </div>
      )}

      {lista.stavke.map((p) => (
        <AdminDogadjajKartica
          key={p.id}
          dogadjaj={p.dogadjaj_Id}
          prijava={p}
          onObrisan={() => ukloni(p.id)}
          onPrijavaOdbacena={() => ukloni(p.id)}
        />
      ))}
      <KrajListe lista={lista} />
    </section>
  );
}

export default AdminPrijave;
