import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const lista = useInfiniteList('/api/users/blocked', { limit: 20 });

  const handleUnblock = async (k) => {
    if (!window.confirm(t('admin.blocked.confirmUnblock', { username: k.username }))) return;
    try {
      await api.del(`/api/users/${k.id}/block`);
      lista.setItems((prev) => prev.filter((x) => x.id !== k.id));
      lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
      toast.success(t('admin.blocked.unblocked', { username: k.username }));
    } catch (error) {
      console.error('Odblokiranje nije uspelo:', error);
      toast.error(t('admin.blocked.unblockFailed'));
    }
  };

  return (
    <section>
      <AdminSectionHeader
        ikona="la-ban"
        naslov={t('admin.blocked.title')}
        opis={t('admin.blocked.description')}
        broj={lista.total}
      />

      <div className="blokirani">
        {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
          <div className="profil-empty admin-prazno">
            <i className="la la-smile-o" />
            {t('admin.blocked.empty')}
          </div>
        )}
        {lista.items.map((k) => (
          <div className="blokirani-red" key={k.id}>
            <Link to={adminUserUrl(k.id)} className="blokirani-link">
              <Avatar className="blokirani-avatar" slika={k.profileImage} ime={k.firstName} />
              <div className="blokirani-tekst">
                <strong>{k.firstName} {k.lastName}</strong>
                <small>@{k.username} · {k.email}</small>
              </div>
            </Link>
            <button type="button" className="blokirani-dugme" onClick={() => handleUnblock(k)}>
              {t('admin.blocked.unblock')}
            </button>
          </div>
        ))}
        <InfiniteScrollFooter lista={lista} />
      </div>
    </section>
  );
}

export default AdminBlockedUsers;
