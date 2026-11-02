import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminSectionHeader from './AdminSectionHeader';
import AdminEventCard from './AdminEventCard';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';

// Admin: prijavljeni dogadjaji (5 po 5, skrolom). Prijava nestaje iz liste kad se
// dogadjaj obrise ili kad se prijava odbaci.
function AdminReports() {
  const { t } = useTranslation();
  const lista = useInfiniteList('/api/reports', { limit: 5 });

  const removeReport = (prijavaId) => {
    lista.setItems((prev) => prev.filter((p) => p.id !== prijavaId));
    lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
  };

  return (
    <section>
      <AdminSectionHeader
        ikona="la-flag"
        naslov={t('admin.reports.title')}
        opis={t('admin.reports.description')}
        broj={lista.total}
      />

      {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-check-circle" />
          {t('admin.reports.empty')}
        </div>
      )}

      {lista.items.map((p) => (
        <AdminEventCard
          key={p.id}
          dogadjaj={p.dogadjaj_Id}
          prijava={p}
          onDeleted={() => removeReport(p.id)}
          onReportDismissed={() => removeReport(p.id)}
        />
      ))}
      <InfiniteScrollFooter lista={lista} />
    </section>
  );
}

export default AdminReports;
