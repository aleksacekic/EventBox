import { api, API_BASE, ApiError } from '../api';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import NapraviDogadjaj from './NapraviDogadjaj';
import Avatar from './Avatar';
import HideShowMapa from './Hide&ShowMapa';
import Komentari from './Komentari';
import Reakcije from './Reakcije';
import { formatDatum } from '../utils/datum';
import { jeZavrsen } from '../utils/dogadjaj';

// Jedna kartica dogadjaja - ceo prikaz (topbar, opis, mapa, reakcije, komentari,
// prijava sadrzaja) na jednom mestu. Koristi ga i feed (Dogadjaj.jsx, lista) i
// deep-link strana (DogadjajPosebnaStrana.jsx, /objava/:id) - pre je ovo bilo
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
// (public/css/style.css), NE stare "post-bar/job_descp/..." klase - one i dalje
// koristi Profil.jsv koji ima svoju (nezavisnu, dupliranu) verziju kartice, pa
// je dirati taj stari CSS ovde rizicno.
function DogadjajKartica({ dogadjaj: izListe, korisnik, onOpen, onObrisi, idsZaReakcije, className = 'dogadjaj-card' }) {
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

  const jeVlasnik = dogadjaj.iD_Kreatora === korisnik.id;
  const zavrsen = jeZavrsen(dogadjaj);

  const stop = (e) => e.stopPropagation(); // da klik unutar kartice ne otvori i onOpen

  const otvoriPrijavuFormu = (e) => {
    stop(e);
    setPrijaviFormaOtvorena(true);
  };

  const zatvoriPrijavuFormu = () => {
    setPrijaviFormaOtvorena(false);
    setSelectedOption('nepozeljan');
    setOpis('');
  };

  const posaljiPrijavu = async (e) => {
    stop(e);
    if (!selectedOption) {
      toast.warn('Molimo odaberite razlog prijave.');
      return;
    }

    try {
      // Jedan zahtev: razlog (i opis samo uz "ostalo"). 401 -> api klijent sam vraca na /login
      await api.post(`/Pr_dog/PrijaviDogadjaj/${dogadjaj.id}`, {
        razlog: selectedOption,
        opis: selectedOption === 'ostalo' ? opis.trim() : '',
      });

      zatvoriPrijavuFormu();
      setPrijavaPoslata(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Server pamti ko je prijavio: isti dogadjaj se ne prijavljuje dvaput
        toast.info('Vec ste prijavili ovaj dogadjaj.');
        zatvoriPrijavuFormu();
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
          <Avatar className="dogadjaj-card-avatar" slika={dogadjaj.slikaKorisnika} ime={dogadjaj.userName_Kreatora} />
          <div className="dogadjaj-card-author-info">
            <h3>@{dogadjaj.userName_Kreatora}</h3>
            <span><i className="la la-clock-o" />{dogadjaj.formattedDatum}</span>
          </div>
        </div>

        {jeVlasnik && (
          <div className={`dogadjaj-card-menu ${menuOpen ? 'is-open' : ''}`} onClick={stop}>
            <button type="button" className="dogadjaj-card-menu-btn" onClick={(e) => { stop(e); setMenuOpen(v => !v); }} aria-label="Opcije">
              <i className="la la-ellipsis-v" />
            </button>
            <ul className="dogadjaj-card-menu-list">
              <li><button type="button" onClick={(e) => { stop(e); setMenuOpen(false); setIzmenaOtvorena(true); }}>Izmeni objavu</button></li>
              <li><button type="button" onClick={(e) => { stop(e); onObrisi(dogadjaj.id); }}>Obrisi objavu</button></li>
            </ul>
          </div>
        )}
      </div>

      <div className="dogadjaj-card-body">
        <h3 className="dogadjaj-card-title">{dogadjaj.naslov}</h3>
        <div className="dogadjaj-card-meta">
          <span className="dogadjaj-card-badge">{dogadjaj.kategorija}</span>
          {zavrsen && <span className="dogadjaj-card-badge dogadjaj-card-badge-zavrsen">Zavrsen</span>}
          <span className="dogadjaj-card-when">
            <i className="la la-calendar" />
            {formatDatum(dogadjaj.datum_Dogadjaja)}. od {dogadjaj.vreme_pocetka}
          </span>
        </div>
        {dogadjaj.opis && <p className="dogadjaj-card-desc">{dogadjaj.opis}</p>}
        {dogadjaj.dogadjajImage && (
          <img src={`${API_BASE}/resources/${dogadjaj.dogadjajImage}`} className="dogadjaj-card-image" />
        )}
        <HideShowMapa latitude={dogadjaj.x} longitude={dogadjaj.y} />
        <Reakcije
          dogadjaj_Id={dogadjaj.id}
          IDucitanidogadjaji={idsZaReakcije ?? [dogadjaj.id]}
          samoPrikaz={zavrsen}
          brojevi={{
            da: dogadjaj.broj_Zainteresovanih,
            mozda: dogadjaj.broj_Mozda,
            ne: dogadjaj.broj_Nezainteresovanih,
          }}
        />
      </div>

      <div className="dogadjaj-card-actions">
        <button type="button" className="dogadjaj-card-action" onClick={(e) => { stop(e); setPrikaziKomentare(v => !v); }}>
          <i className="la la-comment" /> Komentar
        </button>
        <button type="button" className="dogadjaj-card-action" onClick={otvoriPrijavuFormu}>
          <i className="la la-flag" /> Prijavi objavu
        </button>
      </div>

      {prijaviFormaOtvorena && (
        <div className="dogadjaj-modal-overlay" onClick={(e) => { stop(e); zatvoriPrijavuFormu(); }}>
          <div className="dogadjaj-modal-card" onClick={stop}>
            <h4>Prijavi objavu</h4>
            <div className="dogadjaj-report-options">
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} defaultChecked onChange={() => setSelectedOption('nepozeljan')} /> Nepozeljan sadrzaj</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('nasilje')} /> Nasilje</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('terorizam')} /> Terorizam</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('govor_mrznje')} /> Govor mrznje</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('lazne_informacije')} /> Lazne informacije</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('uznemiravanje')} /> Uznemiravanje</label>
              <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('ostalo')} /> Ostalo</label>
            </div>
            {selectedOption === 'ostalo' && (
              <div className="dogadjaj-report-ostalo">
                <label>Opisite nam razlog prijave:</label>
                <textarea rows={3} value={opis} onChange={(e) => setOpis(e.target.value)} />
              </div>
            )}
            <div className="dogadjaj-modal-actions">
              <button type="button" className="dogadjaj-modal-cancel" onClick={(e) => { stop(e); zatvoriPrijavuFormu(); }}>Otkazi</button>
              <button type="button" className="dogadjaj-modal-submit" onClick={posaljiPrijavu}>Prijavi</button>
            </div>
          </div>
        </div>
      )}

      {prijavaPoslata && (
        <div className="dogadjaj-modal-overlay" onClick={(e) => { stop(e); setPrijavaPoslata(false); }}>
          <div className="dogadjaj-modal-card dogadjaj-modal-card-sm" onClick={stop}>
            <button type="button" className="dogadjaj-modal-close" onClick={(e) => { stop(e); setPrijavaPoslata(false); }} aria-label="Zatvori">×</button>
            <p>Uspesno ste prijavili objavu koja krsi pravila zajednice. Administrator ce uskoro pregledati vasu prijavu. Hvala!</p>
          </div>
        </div>
      )}

      {/* Portal na <body>: modal ne sme da bude unutar kartice (njen onClick otvara objavu,
          a CSS transformacija kartice bi pomerila "fixed" pozadinu) */}
      {izmenaOtvorena && createPortal(
        <div onClick={stop}>
          <NapraviDogadjaj
            otvorena
            dogadjaj={dogadjaj}
            onZatvori={() => setIzmenaOtvorena(false)}
            onKreiran={(d) => setIzmenjen(d)}
          />
        </div>,
        document.body
      )}

      {prikaziKomentare && (
        <div className="dogadjaj-card-comments" onClick={stop}>
          <Komentari
            dogadjajId={dogadjaj.id}
            prikazaniDogadjaj={dogadjaj.id}
            korisnikovaSlika={korisnik.korisnikImage}
            korisnikovoIme={korisnik.ime}
          />
        </div>
      )}
    </div>
  );
}

export default DogadjajKartica;
