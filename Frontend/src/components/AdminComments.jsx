import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { api } from '../api';
import Avatar from './Avatar';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';
import { formatDateTime } from '../utils/date';
import { adminUserUrl } from '../utils/admin';

// Admin: komentari jednog dogadjaja (najnoviji prvi, 10 po 10) i brisanje bilo kog komentara.
// Administrator vidi i komentare blokiranih korisnika (korisnicima su sakriveni), sa oznakom.
function AdminComments({ dogadjajId }) {
  const { t } = useTranslation();
  const lista = useInfiniteList(`/api/events/${dogadjajId}/comments`, { limit: 10 });
  const [brise, setBrise] = useState(null);

  const handleDelete = async (k) => {
    if (brise || !window.confirm(t('admin.comments.confirmDelete', { username: k.username_korisnika }))) return;
    setBrise(k.id);
    try {
      await api.del(`/api/comments/${k.id}`);
      lista.setItems((prev) => prev.filter((x) => x.id !== k.id));
      lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
      toast.success(t('admin.comments.deleted'));
    } catch (error) {
      console.error('Brisanje komentara nije uspelo:', error);
      toast.error(t('admin.comments.deleteFailed'));
    } finally {
      setBrise(null);
    }
  };

  return (
    <div className="admin-komentari">
      <div className="admin-panel-naslov">
        {t('admin.comments.title')}{lista.total != null && <span className="admin-broj">{lista.total}</span>}
      </div>

      {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
        <p className="admin-komentari-prazno">{t('admin.comments.empty')}</p>
      )}

      <ul>
        {lista.items.map((k) => (
          <li key={k.id} className="admin-komentar">
            <Avatar className="komentar-avatar" slika={k.slikaKorisnika} ime={k.username_korisnika} />
            <div className="admin-komentar-sadrzaj">
              <div className="admin-komentar-red">
                <Link to={adminUserUrl(k.autorId)} className="admin-komentar-autor">@{k.username_korisnika}</Link>
                {k.autorBlokiran && <span className="admin-status is-blokiran">{t('admin.comments.blocked')}</span>}
                <span className="admin-komentar-vreme">{formatDateTime(k.vreme)}</span>
              </div>
              <p>{k.tekst}</p>
            </div>
            <button
              type="button"
              className="admin-komentar-obrisi"
              onClick={() => handleDelete(k)}
              disabled={brise === k.id}
              title={t('admin.comments.deleteTitle')}
              aria-label={t('admin.comments.deleteLabel', { username: k.username_korisnika })}
            >
              <i className="la la-trash" />
            </button>
          </li>
        ))}
      </ul>
      <InfiniteScrollFooter lista={lista} />
    </div>
  );
}

export default AdminComments;
