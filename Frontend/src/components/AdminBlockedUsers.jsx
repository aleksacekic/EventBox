import React from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import AdminSectionHeader from './AdminSectionHeader';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';
import { adminUserUrl } from '../utils/admin';

// Admin: lista blokiranih korisnika (20 po 20, skrolom) i odblokiranje.
// Klik na korisnika otvara admin pregled korisnika.
function AdminBlockedUsers() {
  const lista = useInfiniteList('/api/users/blocked', { limit: 20 });

  const handleUnblock = async (k) => {
    if (!window.confirm(`Odblokirati korisnika @${k.korisnicko_Ime}? Ponovo ce moci da se prijavi.`)) return;
    try {
      await api.del(`/api/users/${k.id}/block`);
      lista.setItems((prev) => prev.filter((x) => x.id !== k.id));
      lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
      toast.success(`Korisnik @${k.korisnicko_Ime} je odblokiran.`);
    } catch (error) {
      console.error('Odblokiranje nije uspelo:', error);
      toast.error('Odblokiranje nije uspelo. Pokusajte ponovo.');
    }
  };

  return (
    <section>
      <AdminSectionHeader
        ikona="la-ban"
        naslov="Blokirani korisnici"
        opis="Blokiran korisnik ne moze da se prijavi. Klik na korisnika otvara njegov pregled."
        broj={lista.total}
      />

      <div className="blokirani">
        {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
          <div className="profil-empty admin-prazno">
            <i className="la la-smile-o" />
            Nema blokiranih korisnika.
          </div>
        )}
        {lista.items.map((k) => (
          <div className="blokirani-red" key={k.id}>
            <Link to={adminUserUrl(k.id)} className="blokirani-link">
              <Avatar className="blokirani-avatar" slika={k.korisnikImage} ime={k.ime} />
              <div className="blokirani-tekst">
                <strong>{k.ime} {k.prezime}</strong>
                <small>@{k.korisnicko_Ime} · {k.email_Adresa}</small>
              </div>
            </Link>
            <button type="button" className="blokirani-dugme" onClick={() => handleUnblock(k)}>
              Odblokiraj
            </button>
          </div>
        ))}
        <InfiniteScrollFooter lista={lista} />
      </div>
    </section>
  );
}

export default AdminBlockedUsers;
