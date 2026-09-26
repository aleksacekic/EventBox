import { api, API_BASE } from '../api';
import React, { useState } from 'react';
import HideShowMapa from './Hide&ShowMapa';
import Komentari from './Komentari'; 
import Reakcije from './Reakcije';

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
function DogadjajKartica({ dogadjaj, korisnik, onOpen, onObrisi, idsZaReakcije, className = 'post-bar' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [prikaziKomentare, setPrikaziKomentare] = useState(false);

  const [prijaviFormaOtvorena, setPrijaviFormaOtvorena] = useState(false);
  const [prijavaPoslata, setPrijavaPoslata] = useState(false);
  const [selectedOption, setSelectedOption] = useState('nepozeljan');
  const [opis, setOpis] = useState('');

  const jeVlasnik = dogadjaj.iD_Kreatora === korisnik.id;

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
      alert('Molimo odaberite razlog prijave.');
      return;
    }

    let razlogPath = `/Razlog/KreirajRazlog/${dogadjaj.id}/${selectedOption}/${opis}`;
    if (selectedOption === 'ostalo' && opis === '') {
      razlogPath += 'bezOpisa';
    }
    if (selectedOption !== 'ostalo') {
      razlogPath += 'nema'; // "nema" na opis ako je selektovano bilo sta osim OSTALO
    }

    try {
      // 401 -> api klijent sam vraca na /login
      await api.post(`/Pr_dog/PrijaviDogadjaj/${dogadjaj.id}`, undefined, { credentials: 'include' });
      await api.post(razlogPath);

      zatvoriPrijavuFormu();
      setPrijavaPoslata(true);
    } catch (error) {
      console.error('Greska prilikom prijave objave:', error);
    }
  };

  return (
    <div
      className={className}
      onClick={onOpen ? () => onOpen(dogadjaj) : undefined}
      style={onOpen ? { cursor: 'pointer' } : undefined}
    >
      <div className="post_topbar">
        <div className="usy-dt">
          <img
            className="profilnaslikaobjava"
            src={dogadjaj.slikaKorisnika ? `${API_BASE}/resources/${dogadjaj.slikaKorisnika}` : "http://via.placeholder.com/50x50"}
          />
          <div className="usy-name">
            <h3>@{dogadjaj.userName_Kreatora}</h3>
            <span><img src="/images/clock.png" />{dogadjaj.formattedDatum}</span>
          </div>
        </div>

        {jeVlasnik && (
          <div className={`ed-opts ${menuOpen ? 'active' : ''}`} onClick={stop}>
            <a className="ed-opts-open" onClick={(e) => { stop(e); setMenuOpen(v => !v); }}>
              <i className="la la-ellipsis-v" />
            </a>
            <ul className={`ed-options ${menuOpen ? 'active' : ''}`}>
              <li><a className='opcijeobjava' onClick={(e) => { stop(e); onObrisi(dogadjaj.id); }}>Obrisi objavu</a></li>
            </ul>
          </div>
        )}
      </div>

      <div className="job_descp">
        <h3>{dogadjaj.naslov}</h3>
        <ul className="job-dt">
          <li><a href="#">{dogadjaj.kategorija}</a></li>
          <li><span>{new Date(dogadjaj.datum_Dogadjaja).toLocaleDateString()} od {dogadjaj.vreme_pocetka}</span></li>
        </ul>
        <p>{dogadjaj.opis}</p>
        {dogadjaj.dogadjajImage && (
          <img src={`${API_BASE}/resources/${dogadjaj.dogadjajImage}`} className="rounded float-left dogadjaj-slika" />
        )}
        <HideShowMapa latitude={dogadjaj.x} longitude={dogadjaj.y} />
        <Reakcije dogadjaj_Id={dogadjaj.id} IDucitanidogadjaji={idsZaReakcije ?? [dogadjaj.id]} />
      </div>

      <div className="job-status-bar">
        <ul className="like-com d-flex">
          <li className="komentardiv" onClick={(e) => { stop(e); setPrikaziKomentare(v => !v); }}>
            <img src="/images/com.png" className="com-slika" />
            <a href="#" className="com">Komentar</a>
          </li>
          <li className="prijavidiv" onClick={otvoriPrijavuFormu}>
            <img src="/images/report17.png" />
            <a href="#" className="report-to-admin">Prijavi objavu</a>
          </li>

          {prijaviFormaOtvorena && (
            <>
              <div className="popup-overlay" onClick={stop} style={{ display: 'block' }} />
              <div className="popup-form" onClick={stop} style={{ display: 'block' }}>
                <div className="form-options">
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} defaultChecked onChange={() => setSelectedOption('nepozeljan')} /> Nepozeljan sadrzaj</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('nasilje')} /> Nasilje</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('terorizam')} /> Terorizam</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('govor_mrznje')} /> Govor mrznje</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('lazne_informacije')} /> Lazne informacije</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('uznemiravanje')} /> Uznemiravanje</label>
                  <label><input type="radio" name={`opcija-${dogadjaj.id}`} onChange={() => setSelectedOption('ostalo')} /> Ostalo</label>
                </div>
                {selectedOption === 'ostalo' && (
                  <div className="form-ostalo">
                    <label>Opisite nam razlog prijave:</label>
                    <textarea rows={3} value={opis} onChange={(e) => setOpis(e.target.value)} />
                  </div>
                )}
                <div className="form-buttons">
                  <button className="btn-otkazi" onClick={(e) => { stop(e); zatvoriPrijavuFormu(); }}>Otkazi</button>
                  <button className="btn-prijavi" onClick={posaljiPrijavu}>Prijavi</button>
                </div>
              </div>
            </>
          )}

          {prijavaPoslata && (
            <>
              <div className="overlay1" onClick={stop} style={{ display: 'block' }} />
              <div className="popup" onClick={stop} style={{ display: 'block' }}>
                <span className="close" onClick={(e) => { stop(e); setPrijavaPoslata(false); }}>×</span>
                <p>Uspesno ste prijavili objavu koja krsi pravila zajednice. Administrator ce uskoro pregledati vasu prijavu. Hvala!</p>
              </div>
            </>
          )}
        </ul>
      </div>

      {prikaziKomentare && (
        <div className="comment-section" onClick={stop}>
          <Komentari
            dogadjajId={dogadjaj.id}
            prikazaniDogadjaj={dogadjaj.id}
            korisnikovaSlika={korisnik.korisnikImage}
          />
        </div>
      )}
    </div>
  );
}

export default DogadjajKartica;
