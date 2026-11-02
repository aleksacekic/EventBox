import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import Avatar from './Avatar';
import AdminEventCard from './AdminEventCard';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';
import { formatDate } from '../utils/date';
import { adminTabUrl } from '../utils/admin';

// Admin: pregled jednog korisnika (/admin?korisnik=ID) - podaci, status naloga,
// blokiranje/odblokiranje i svi njegovi dogadjaji.
function AdminUserDetails({ id }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [k, setK] = useState(null);
  const [greska, setGreska] = useState(null);
  const [radi, setRadi] = useState(false);
  const lista = useInfiniteList(`/api/users/${id}/events`, { limit: 5 });

  useEffect(() => {
    let vazi = true;
    setK(null);
    setGreska(null);
    api.get(`/api/users/${id}/details`)
      .then((data) => vazi && setK(data))
      .catch((error) => vazi && setGreska(error));
    return () => { vazi = false; };
  }, [id]);

  // Nazad na prethodnu stranu, a ako je pregled otvoren direktnim linkom - na prijave
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(adminTabUrl('prijave'));
  };

  const toggleBlock = async () => {
    const blokiraj = !k.isBlocked;
    const pitanje = blokiraj
      ? t('admin.user.confirmBlock', { username: k.username })
      : t('admin.user.confirmUnblock', { username: k.username });
    if (radi || !window.confirm(pitanje)) return;
    setRadi(true);
    try {
      const url = `/api/users/${k.id}/block`;
      await (blokiraj ? api.put(url) : api.del(url));
      setK((prev) => ({ ...prev, isBlocked: blokiraj }));
      toast.success(t(blokiraj ? 'admin.user.blockedToast' : 'admin.user.unblockedToast', { username: k.username }));
    } catch (error) {
      console.error('Promena blokade nije uspela:', error);
      toast.error(t('admin.user.actionFailed'));
    } finally {
      setRadi(false);
    }
  };

  const handleDeleted = (dogadjajId) => {
    lista.setItems((prev) => prev.filter((d) => d.id !== dogadjajId));
    lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
  };

  const dugmeNazad = (
    <button type="button" className="admin-nazad" onClick={goBack}>
      <i className="la la-arrow-left" /> {t('common.back')}
    </button>
  );

  if (greska) {
    return (
      <section>
        {dugmeNazad}
        <div className="profil-empty admin-prazno">
          <i className="la la-user-times" />
          {greska.status === 404 ? t('admin.user.notFound') : t('admin.user.loadFailed')}
        </div>
      </section>
    );
  }

  return (
    <section>
      {dugmeNazad}

      <div className="admin-korisnik">
        {k ? (
          <>
            <Avatar className="admin-korisnik-avatar" slika={k.profileImage} ime={k.firstName} />
            <div className="admin-korisnik-info">
              <h2>
                {k.firstName} {k.lastName}
                <span className={`admin-status ${k.isBlocked ? 'is-blokiran' : 'is-aktivan'}`}>
                  {k.isBlocked ? t('admin.user.blocked') : t('admin.user.active')}
                </span>
              </h2>
              <div className="admin-korisnik-korisnicko">@{k.username}</div>
              <div className="admin-korisnik-detalji">
                <span><i className="la la-envelope" /> {k.email}</span>
                <span><i className="la la-birthday-cake" /> {formatDate(k.dateOfBirth)}</span>
                <span><i className="la la-calendar" /> {t('admin.user.eventCount', { count: lista.total ?? k.eventCount })}</span>
                <span className={k.reportCount > 0 ? 'admin-korisnik-prijave' : undefined}>
                  <i className="la la-flag" />{' '}
                  {k.reportCount > 0 ? t('admin.user.reportedTimes', { count: k.reportCount }) : t('admin.user.noReports')}
                </span>
              </div>
              {k.isBlocked && (
                <p className="admin-skriveno">
                  <i className="la la-eye-slash" /> {t('admin.user.hiddenNote')}
                </p>
              )}
            </div>
            <button
              type="button"
              className={`admin-dugme ${k.isBlocked ? 'is-odblokiraj' : ''}`}
              onClick={toggleBlock}
              disabled={radi}
            >
              <i className={`la ${k.isBlocked ? 'la-unlock' : 'la-ban'}`} />
              {k.isBlocked ? t('admin.user.unblock') : t('admin.user.block')}
            </button>
          </>
        ) : (
          <div className="admin-korisnik-ucitava">{t('common.loading')}</div>
        )}
      </div>

      <h3 className="admin-podnaslov">
        {t('admin.user.events')}
        {lista.total != null && <span className="admin-broj">{lista.total}</span>}
      </h3>

      {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
        <div className="profil-empty admin-prazno">
          <i className="la la-calendar-o" />
          {t('admin.user.noEvents')}
        </div>
      )}

      {lista.items.map((d) => (
        <AdminEventCard key={d.id} dogadjaj={d} prikaziAutora={false} onDeleted={handleDeleted} />
      ))}
      <InfiniteScrollFooter lista={lista} />
    </section>
  );
}

export default AdminUserDetails;
