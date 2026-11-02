import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminSectionHeader from './AdminSectionHeader';
import AdminEventCard from './AdminEventCard';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';

// Admin: svi dogadjaji, i oni koji su prosli (5 po 5, skrolom), sa pretragom po nazivu.
function AdminEvents() {
  const { t } = useTranslation();
  const [unos, setUnos] = useState('');
  const [pretraga, setPretraga] = useState('');

  // Pretraga krece kad korisnik zastane sa kucanjem, ne na svako slovo
  useEffect(() => {
    const tajmer = setTimeout(() => setPretraga(unos.trim()), 300);
    return () => clearTimeout(tajmer);
  }, [unos]);

  const putanja = pretraga
    ? `/api/events/all?title=${encodeURIComponent(pretraga)}`
    : '/api/events/all';
  const lista = useInfiniteList(putanja, { limit: 5 });

  const handleDeleted = (id) => {
    lista.setItems((prev) => prev.filter((d) => d.id !== id));
    lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
  };

  return (
    <section>
      <AdminSectionHeader
        ikona="la-calendar"
        naslov={t('admin.events.title')}
        opis={t('admin.events.description')}
        broj={lista.total}
      >
        <div className="admin-pretraga">
          <i className="la la-search" />
          <input
            type="search"
            placeholder={t('admin.events.searchPlaceholder')}
            aria-label={t('admin.events.searchLabel')}
            value={unos}
            onChange={(e) => setUnos(e.target.value)}
          />
        </div>
      </AdminSectionHeader>

      {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-calendar-o" />
          {pretraga ? t('admin.events.noMatch', { query: pretraga }) : t('admin.events.empty')}
        </div>
      )}

      {lista.items.map((d) => (
        <AdminEventCard key={d.id} dogadjaj={d} onDeleted={handleDeleted} />
      ))}
      <InfiniteScrollFooter lista={lista} />
    </section>
  );
}

export default AdminEvents;
