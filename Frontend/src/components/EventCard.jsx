import { api, API_BASE, ApiError } from '../api';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import EventForm from './EventForm';
import Avatar from './Avatar';
import MapToggle from './MapToggle';
import CommentSection from './CommentSection';
import ReactionButtons from './ReactionButtons';
import { formatDate } from '../utils/date';
import { isEventFinished, categoryLabel } from '../utils/event';

// Jedna kartica dogadjaja - ceo prikaz (topbar, opis, mapa, reakcije, komentari,
// prijava sadrzaja) na jednom mestu. Koristi ga i feed (EventFeed.jsx, lista) i
// deep-link strana (EventDetails.jsx, /objava/:id) - pre je ovo bilo
// kopirano u oba fajla.
//
// Sve popup/meni state je LOKALNO u kartici (ne prosledjeno spolja), pa je
// svaka kartica potpuno samostalna:
//  - report-forma i "hvala" poruka su React state (ne document.getElementById
//    po stringovima id-jeva kao pre - to je i pravilo dupla DOM id-jeva kad je
//    vise kartica na stranici odjednom)
//  - otvaranje komentara na jednoj kartici ne zatvara komentare na drugoj
//
// Napomena o CSS klasama: kartica koristi sopstveni "dogadjaj-card-*" namespace
// (public/css/style.css), NE stare "post-bar/job_descp/..." klase iz pocetne teme.
function EventCard({ dogadjaj: izListe, korisnik, onOpen, onDelete, idsZaReakcije, className = 'dogadjaj-card' }) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Izmena: forma se otvara iz kartice, a izmenjeni podaci se prikazuju odmah (bez ponovnog ucitavanja liste)
  const [izmenaOtvorena, setIzmenaOtvorena] = useState(false);
  const [izmenjen, setIzmenjen] = useState(null);
  const dogadjaj = izmenjen ? { ...izListe, ...izmenjen } : izListe;
  const [prikaziKomentare, setPrikaziKomentare] = useState(false);

  const [prijaviFormaOtvorena, setPrijaviFormaOtvorena] = useState(false);
  const [prijavaPoslata, setPrijavaPoslata] = useState(false);
  const [selectedOption, setSelectedOption] = useState('nepozeljan');
  const [opis, setOpis] = useState('');

  const jeVlasnik = dogadjaj.creatorId === korisnik.id;
  const zavrsen = isEventFinished(dogadjaj);

  const stopClick = (e) => e.stopPropagation(); // da klik unutar kartice ne otvori i onOpen

  const openReportForm = (e) => {
    stopClick(e);
    setPrijaviFormaOtvorena(true);
  };

  const closeReportForm = () => {
    setPrijaviFormaOtvorena(false);
    setSelectedOption('nepozeljan');
    setOpis('');
  };

  const submitReport = async (e) => {
    stopClick(e);
    if (!selectedOption) {
      toast.warn(t('report.chooseReason'));
      return;
    }

    try {
      // Jedan zahtev: razlog (i opis samo uz "ostalo"). 401 -> api klijent sam vraca na /login
      await api.post(`/api/events/${dogadjaj.id}/reports`, {
        razlog: selectedOption,
        opis: selectedOption === 'ostalo' ? opis.trim() : '',
      });

      closeReportForm();
      setPrijavaPoslata(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Server pamti ko je prijavio: isti dogadjaj se ne prijavljuje dvaput
        toast.info(t('report.alreadyReported'));
        closeReportForm();
        setPrijavaPoslata(true);
        return;
      }
      console.error('Greska prilikom prijave objave:', error);
    }
  };

  return (
    <div
      className={`${className} ${dogadjaj._isNovi ? 'novi-dogadjaj' : ''}`}
      onClick={onOpen ? () => onOpen(dogadjaj) : undefined}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      <div className="dogadjaj-card-header">
        <div className="dogadjaj-card-author">
          <Avatar className="dogadjaj-card-avatar" slika={dogadjaj.creatorImage} ime={dogadjaj.creatorUsername} />
          <div className="dogadjaj-card-author-info">
            <h3>@{dogadjaj.creatorUsername}</h3>
            <span><i className="la la-clock-o" />{formatDate(dogadjaj.createdAt)}</span>
          </div>
        </div>

        {jeVlasnik && (
          <div className={`dogadjaj-card-menu ${menuOpen ? 'is-open' : ''}`} onClick={stopClick}>
            <button type="button" className="dogadjaj-card-menu-btn" onClick={(e) => { stopClick(e); setMenuOpen(v => !v); }} aria-label={t('common.options')}>
              <i className="la la-ellipsis-v" />
            </button>
            <ul className="dogadjaj-card-menu-list">
              <li><button type="button" onClick={(e) => { stopClick(e); setMenuOpen(false); setIzmenaOtvorena(true); }}>{t('events.edit')}</button></li>
              <li><button type="button" onClick={(e) => { stopClick(e); onDelete(dogadjaj.id); }}>{t('events.delete')}</button></li>
            </ul>
          </div>
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
        {dogadjaj.description && <p className="dogadjaj-card-desc">{dogadjaj.description}</p>}
        {dogadjaj.image && (
          <img src={`${API_BASE}/resources/${dogadjaj.image}`} className="dogadjaj-card-image" />
        )}
        <MapToggle latitude={dogadjaj.latitude} longitude={dogadjaj.longitude} />
        <ReactionButtons
          dogadjaj_Id={dogadjaj.id}
          IDucitanidogadjaji={idsZaReakcije ?? [dogadjaj.id]}
          samoPrikaz={zavrsen}
          brojevi={{
            da: dogadjaj.interestedCount,
            mozda: dogadjaj.maybeCount,
            ne: dogadjaj.notInterestedCount,
          }}
        />
      </div>

      <div className="dogadjaj-card-actions">
        <button type="button" className="dogadjaj-card-action" onClick={(e) => { stopClick(e); setPrikaziKomentare(v => !v); }}>
          <i className="la la-comment" /> {t('events.comment')}
        </button>
        <button type="button" className="dogadjaj-card-action" onClick={openReportForm}>
          <i className="la la-flag" /> {t('events.report')}
        </button>
      </div>

      {prijaviFormaOtvorena && (
        <div className="dogadjaj-modal-overlay" onClick={(e) => { stopClick(e); closeReportForm(); }}>
          <div className="dogadjaj-modal-card" onClick={stopClick}>
            <h4>{t('report.title')}</h4>
            <div className="dogadjaj-report-options">
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} defaultChecked onChange={() => setSelectedOption('nepozeljan')} /> {t('reportReasons.nepozeljan')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('nasilje')} /> {t('reportReasons.nasilje')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('terorizam')} /> {t('reportReasons.terorizam')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('govor_mrznje')} /> {t('reportReasons.govor_mrznje')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('lazne_informacije')} /> {t('reportReasons.lazne_informacije')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('uznemiravanje')} /> {t('reportReasons.uznemiravanje')}</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('ostalo')} /> {t('reportReasons.ostalo')}</label>
            </div>
            {selectedOption === 'ostalo' && (
              <div className="dogadjaj-report-ostalo">
                <label>{t('report.describe')}</label>
                <textarea rows={3} value={opis} onChange={(e) => setOpis(e.target.value)} />
              </div>
            )}
            <div className="dogadjaj-modal-actions">
              <button type="button" className="dogadjaj-modal-cancel" onClick={(e) => { stopClick(e); closeReportForm(); }}>{t('common.cancel')}</button>
              <button type="button" className="dogadjaj-modal-submit" onClick={submitReport}>{t('report.submit')}</button>
            </div>
          </div>
        </div>
      )}

      {prijavaPoslata && (
        <div className="dogadjaj-modal-overlay" onClick={(e) => { stopClick(e); setPrijavaPoslata(false); }}>
          <div className="dogadjaj-modal-card dogadjaj-modal-card-sm" onClick={stopClick}>
            <button type="button" className="dogadjaj-modal-close" onClick={(e) => { stopClick(e); setPrijavaPoslata(false); }} aria-label={t('common.close')}>×</button>
            <p>{t('report.success')}</p>
          </div>
        </div>
      )}

      {/* Portal na <body>: modal ne sme da bude unutar kartice (njen onClick otvara objavu,
          a CSS transformacija kartice bi pomerila "fixed" pozadinu) */}
      {izmenaOtvorena && createPortal(
        <div onClick={stopClick}>
          <EventForm
            otvorena
            dogadjaj={dogadjaj}
            onClose={() => setIzmenaOtvorena(false)}
            onSaved={(d) => setIzmenjen(d)}
          />
        </div>,
        document.body
      )}

      {prikaziKomentare && (
        <div className="dogadjaj-card-comments" onClick={stopClick}>
          <CommentSection
            dogadjajId={dogadjaj.id}
            prikazaniDogadjaj={dogadjaj.id}
            korisnikovaSlika={korisnik.profileImage}
            korisnikovoIme={korisnik.firstName}
          />
        </div>
      )}
    </div>
  );
}

export default EventCard;
