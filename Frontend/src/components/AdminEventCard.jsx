import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { api, API_BASE } from '../api';
import Avatar from './Avatar';
import MapToggle from './MapToggle';
import AdminComments from './AdminComments';
import { formatDate } from '../utils/date';
import { isEventFinished, categoryLabel } from '../utils/event';
import { adminUserUrl } from '../utils/admin';

// Kartica dogadjaja za administratora. Izgled je isti kao kartica na feedu (dogadjaj-card-*),
// ali bez reakcija i forme za komentar, a sa akcijama moderacije.
//  - prijava: red iz GET /api/reports (broj prijava + do 5 razloga) kad se
//    kartica prikazuje u listi prijava; tada postoje i "Razlozi" i "Odbaci prijavu"
//  - prikaziAutora=false: na pregledu korisnika (autor je vec prikazan iznad liste,
//    a blokiranje je dugme na kartici korisnika)
function AdminEventCard({ dogadjaj, prijava, onDeleted, onReportDismissed, prikaziAutora = true }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [panel, setPanel] = useState(null); // 'razlozi' | 'komentari' | null
  const [radi, setRadi] = useState(false); // dok traje jedna radnja, dugmad su iskljucena
  // Blokiran autor: dogadjaj je sakriven za korisnike (admin ga vidi). Menja se i odavde.
  const [autorBlokiran, setAutorBlokiran] = useState(Boolean(dogadjaj.creatorIsBlocked));
  const zavrsen = isEventFinished(dogadjaj);

  const togglePanel = (ime) => setPanel((p) => (p === ime ? null : ime));

  const runAction = async (pitanje, posao) => {
    if (radi || !window.confirm(pitanje)) return;
    setRadi(true);
    try {
      await posao();
    } finally {
      setRadi(false);
    }
  };

  const handleDelete = () => runAction(
    t('admin.card.confirmDelete', { title: dogadjaj.title }),
    async () => {
      try {
        await api.del(`/api/events/${dogadjaj.id}`);
        toast.success(t('admin.card.deleted'));
        onDeleted?.(dogadjaj.id);
      } catch (error) {
        console.error('Brisanje nije uspelo:', error);
        toast.error(t('admin.card.deleteFailed'));
      }
    }
  );

  const toggleAuthorBlock = () => {
    const blokiraj = !autorBlokiran;
    const username = dogadjaj.creatorUsername;
    return runAction(
      blokiraj
        ? t('admin.card.confirmBlock', { username })
        : t('admin.card.confirmUnblock', { username }),
      async () => {
        try {
          const url = `/api/users/${dogadjaj.creatorId}/block`;
          await (blokiraj ? api.put(url) : api.del(url));
          setAutorBlokiran(blokiraj);
          toast.success(t(blokiraj ? 'admin.card.blocked' : 'admin.card.unblocked', { username }));
        } catch (error) {
          console.error('Promena blokade nije uspela:', error);
          toast.error(t('admin.card.actionFailed'));
        }
      }
    );
  };

  const dismissReport = () => runAction(
    t('admin.card.confirmDismiss'),
    async () => {
      try {
        await api.del(`/api/reports/${prijava.id}`);
        toast.success(t('admin.card.dismissed'));
        onReportDismissed?.(prijava.id);
      } catch (error) {
        console.error('Odbacivanje nije uspelo:', error);
        toast.error(t('admin.card.dismissFailed'));
      }
    }
  );

  const objavljeno = (
    <span><i className="la la-clock-o" />{t('admin.card.published', { date: formatDate(dogadjaj.createdAt) })}</span>
  );

  return (
    <article className="dogadjaj-card admin-kartica">
      <div className="dogadjaj-card-header">
        {prikaziAutora ? (
          <button
            type="button"
            className="dogadjaj-card-author admin-autor"
            onClick={() => navigate(adminUserUrl(dogadjaj.creatorId))}
            title={t('admin.card.userOverview')}
          >
            <Avatar className="dogadjaj-card-avatar" slika={dogadjaj.creatorImage} ime={dogadjaj.creatorUsername} />
            <span className="dogadjaj-card-author-info">
              <strong className="admin-autor-ime">@{dogadjaj.creatorUsername}</strong>
              {objavljeno}
            </span>
          </button>
        ) : (
          <div className="dogadjaj-card-author-info">{objavljeno}</div>
        )}

        {prijava && (
          <span className="admin-prijave-broj">
            <i className="la la-flag" /> {t('admin.card.reportCount', { count: prijava.reportCount })}
          </span>
        )}
      </div>

      <div className="dogadjaj-card-body">
        <h3 className="dogadjaj-card-title">{dogadjaj.title}</h3>
        <div className="dogadjaj-card-meta">
          <span className="dogadjaj-card-badge">{categoryLabel(t, dogadjaj.category)}</span>
          {zavrsen && <span className="dogadjaj-card-badge dogadjaj-card-badge-zavrsen">{t('events.finished')}</span>}
          <span className="dogadjaj-card-when">
            <i className="la la-calendar" />
            {t('events.when', { date: formatDate(dogadjaj.date), time: dogadjaj.startTime })}
          </span>
        </div>
        {autorBlokiran && prikaziAutora && (
          <p className="admin-skriveno">
            <i className="la la-eye-slash" /> {t('admin.card.authorBlockedNote')}
          </p>
        )}
        {dogadjaj.description && <p className="dogadjaj-card-desc">{dogadjaj.description}</p>}
        {dogadjaj.image && (
          <img src={`${API_BASE}/resources/${dogadjaj.image}`} alt="" loading="lazy" className="dogadjaj-card-image" />
        )}
        <MapToggle latitude={dogadjaj.latitude} longitude={dogadjaj.longitude} />
        <div className="admin-reakcije" aria-label={t('admin.card.reactionsLabel')}>
          <span><i className="la la-thumbs-up" /> {t('admin.card.interested', { n: dogadjaj.interestedCount })}</span>
          <span><i className="la la-question-circle" /> {t('admin.card.maybe', { n: dogadjaj.maybeCount })}</span>
          <span><i className="la la-thumbs-down" /> {t('admin.card.notInterested', { n: dogadjaj.notInterestedCount })}</span>
        </div>
      </div>

      <div className="dogadjaj-card-actions admin-akcije">
        {prijava && (
          <>
            <button
              type="button"
              className={`dogadjaj-card-action ${panel === 'razlozi' ? 'is-active' : ''}`}
              onClick={() => togglePanel('razlozi')}
              aria-expanded={panel === 'razlozi'}
            >
              <i className="la la-list" /> {t('admin.card.reasons')}
            </button>
            <button type="button" className="dogadjaj-card-action" onClick={dismissReport} disabled={radi}>
              <i className="la la-check" /> {t('admin.card.dismiss')}
            </button>
          </>
        )}
        <button
          type="button"
          className={`dogadjaj-card-action ${panel === 'komentari' ? 'is-active' : ''}`}
          onClick={() => togglePanel('komentari')}
          aria-expanded={panel === 'komentari'}
        >
          <i className="la la-comments" /> {t('admin.card.comments')}
        </button>
        {prikaziAutora && (
          <button type="button" className="dogadjaj-card-action" onClick={toggleAuthorBlock} disabled={radi}>
            <i className={`la ${autorBlokiran ? 'la-unlock' : 'la-ban'}`} /> {autorBlokiran ? t('admin.card.unblockAuthor') : t('admin.card.blockAuthor')}
          </button>
        )}
        <button type="button" className="dogadjaj-card-action is-danger" onClick={handleDelete} disabled={radi}>
          <i className="la la-trash" /> {t('admin.card.deleteEvent')}
        </button>
      </div>

      {prijava && panel === 'razlozi' && (
        <ul className="admin-razlozi">
          {prijava.reasons.map((r) => (
            <li key={r.id}>
              <span className="admin-razlog-oznaka">{t(`reportReasons.${r.reason}`, { defaultValue: r.reason })}</span>
              {r.description && <p>{r.description}</p>}
            </li>
          ))}
          {/* Server uz svaku prijavu salje najvise 5 razloga */}
          {prijava.reportCount > prijava.reasons.length && (
            <li className="admin-razlozi-jos">
              {t('admin.card.moreReports', { count: prijava.reportCount - prijava.reasons.length })}
            </li>
          )}
        </ul>
      )}

      {panel === 'komentari' && <AdminComments dogadjajId={dogadjaj.id} />}
    </article>
  );
}

export default AdminEventCard;
