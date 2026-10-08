import { api, ApiError } from '../api';
import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState, useCallback } from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import { format } from 'date-fns';
import TimePicker from './TimePicker'
import Map from './Mapa'
import { useAuth } from '../auth';
// import moment from 'moment';

function NapraviDogadjaj({ otvorena = false, onZatvori = () => {}, onKreiran = () => {} }) {

  const { userId } = useAuth();

  registerLocale("sr-Latn", srLatn);  

  
  const google = window.google;

const [naslov, setNaslov] = useState('');
const [kategorija, setKategorija] = useState('Ostalo');
const [slika, setSlika] = useState(null);
const [datumDogadjaja, setDatumDogadjaja] = useState('');
const [vremePocetka, setVremePocetka] = useState('');
const [opis, setOpis] = useState('');
const [x, setX] = useState('');
const [y, setY] = useState('');
const [greske, setGreske] = useState({}); // polje -> poruka (iste provere kao na serveru)
const [salje, setSalje] = useState(false);



// Iste provere kao DogadjajZahtev.Proveri na serveru - ovde samo da korisnik odmah vidi gresku
const proveri = () => {
  const g = {};
  const n = naslov.trim();
  if (n.length < 3 || n.length > 100) g.naslov = 'Naziv mora imati od 3 do 100 karaktera.';
  if (!(datumDogadjaja instanceof Date)) g.datum = 'Izaberite datum.';
  if (!vremePocetka) g.vreme = 'Izaberite vreme pocetka.';
  if (x === '' || y === '') g.lokacija = 'Oznacite lokaciju na mapi.';
  return g;
};

const kreirajDogadjaj = async (e) => {
  e.preventDefault();
  const g = proveri();
  setGreske(g);
  if (Object.keys(g).length > 0 || salje) return;

  setSalje(true);
  try {
    // Sve ide u telu zahteva; kreatora i datum objave postavlja server
    const dogadjaj = await api.post('/Dogadjaj/DodajDogadjaj', {
      naslov: naslov.trim(),
      opis: opis.trim(),
      kategorija,
      // format(..., 'yyyy-MM-dd') a ne toISOString() - potonji racuna u UTC i oko ponoci pomera dan
      datumDogadjaja: format(datumDogadjaja, 'yyyy-MM-dd'),
      vremePocetka,
      x,
      y,
    });

    if (slika) {
      const formData = new FormData();
      formData.append('fajl', slika);
      const slikaStatus = await api.post(`/Dogadjaj/DodajSlikuDogadjaju?dogadjaj_id=${dogadjaj.id}`, formData);
      if (slikaStatus.statusCode === 1) {
        dogadjaj.dogadjajImage = slikaStatus.message;
      }
    }

    resetujFormu();
    onZatvori();
    onKreiran(dogadjaj);
  } catch (error) {
    if (error instanceof ApiError && error.data?.greske) {
      setGreske(error.data.greske); // server je odbio neko polje - prikazi ispod tog polja
    } else {
      const poruka = error instanceof ApiError ? error.message : String(error);
      console.error('Kreiranje dogadjaja nije uspelo:', poruka);
      setGreske({ opste: 'Kreiranje dogadjaja nije uspelo. Pokusajte ponovo.' });
    }
  } finally {
    setSalje(false);
  }
};

const resetujFormu = () => {
  setGreske({});
  setNaslov('');
  setKategorija('Ostalo');
  setSlika(null);
  setDatumDogadjaja('');
  setVremePocetka('');
  setOpis('');
  setX('');
  setY('');
};



  

const handleDatePickerChange = (date) => {
  const local = (new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`));
  setDatumDogadjaja(local);
};

const handleMapMarker = (latitude, longitude) => {
  setX(latitude);
  setY(longitude);
};

const handleSlikaChange = (e) => {
  setSlika(e.target.files[0]);
};

// ESC zatvara formu dok je otvorena
useEffect(() => {
  if (!otvorena) return;
  const handleEsc = (e) => {
    if (e.key === 'Escape') onZatvori();
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [otvorena, onZatvori]);

// Klik van kartice (na tamni overlay) zatvara formu
const handleOverlayClick = useCallback((e) => {
  if (e.target === e.currentTarget) onZatvori();
}, [onZatvori]);

  return (
    <div>
      <div
        className={`create-event-modal ${otvorena ? 'is-open' : ''}`}
        id="forma"
        onClick={handleOverlayClick}
      >
        <div className="create-event-card">
          <div className="create-event-header">
            <h3>Napravi dogadjaj</h3>
            <button
              type="button"
              className="create-event-close"
              onClick={onZatvori}
              aria-label="Zatvori"
            >
              <i className="la la-times" />
            </button>
          </div>

          <form onSubmit={kreirajDogadjaj} className="create-event-form">
            <div className="create-event-field">
              <label htmlFor="ced-naziv">Naziv</label>
              <input
                id="ced-naziv"
                type="text"
                name="title"
                placeholder="Naziv dogadjaja"
                className={`create-event-input ${greske.naslov ? 'create-event-input-invalid' : ''}`}
                maxLength={100}
                value={naslov}
                onChange={(e) => setNaslov(e.target.value)}
              />
              {greske.naslov && <span className="create-event-error">{greske.naslov}</span>}
            </div>

            <div className="create-event-row">
              <div className="create-event-field">
                <label htmlFor="ced-kategorija">Kategorija</label>
                <select
                  id="ced-kategorija"
                  className="create-event-input create-event-select"
                  value={kategorija}
                  onChange={(e) => setKategorija(e.target.value)}
                >
                  <option>Ostalo</option>
                  <option>Zurka</option>
                  <option>Humanitarna akcija</option>
                  <option>Ekoloska akcija</option>
                  <option>Sportski dogadjaj</option>
                  <option>Koncert</option>
                </select>
                {greske.kategorija && <span className="create-event-error">{greske.kategorija}</span>}
              </div>

              <div className="create-event-field">
                <label htmlFor="ced-slika">Slika</label>
                <label htmlFor="ced-slika" className="create-event-file">
                  <i className="la la-image" />
                  <span>{slika ? slika.name : 'Dodaj sliku...'}</span>
                </label>
                <input
                  id="ced-slika"
                  type="file"
                  accept="image/*"
                  onChange={handleSlikaChange}
                  hidden
                />
              </div>
            </div>

            <div className="create-event-row">
              <div className="create-event-field">
                <label htmlFor="ced-datum">Datum</label>
                <DatePicker
                  id="ced-datum"
                  selected={datumDogadjaja}
                  onChange={handleDatePickerChange}
                  locale="sr-Latn"
                  minDate={new Date()}
                  dateFormat="d.M.yyyy."
                  calendarClassName="eb-calendar"
                  dayClassName={(date) =>
                    date.getDay() === 0 || date.getDay() === 6 ? "weekend-day" : ""
                  }
                  placeholderText="Izaberite datum"
                  className="create-event-input"
                  wrapperClassName="create-event-date-wrapper"
                />
                {greske.datum && <span className="create-event-error">{greske.datum}</span>}
              </div>

              <div className="create-event-field">
                <label htmlFor="time">Vreme</label>
                <TimePicker
                  value={vremePocetka}
                  onChange={(value) => setVremePocetka(value)}
                />
                {greske.vreme && <span className="create-event-error">{greske.vreme}</span>}
              </div>
            </div>

            <div className="create-event-field">
              <label>Lokacija</label>
              <div className="create-event-map">
                <Map
                  x={x}
                  y={y}
                  onMapMarker={handleMapMarker}
                />
              </div>
              {greske.lokacija && <span className="create-event-error">{greske.lokacija}</span>}
            </div>

            <div className="create-event-field">
              <label htmlFor="ced-opis">Opis</label>
              <textarea
                id="ced-opis"
                name="description"
                placeholder="Opis dogadjaja (max 200 karaktera)"
                className="create-event-input create-event-textarea"
                maxLength={200}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
              />
              {greske.opis && <span className="create-event-error">{greske.opis}</span>}
            </div>

            {greske.opste && <span className="create-event-error">{greske.opste}</span>}
            <div className="create-event-actions">
              <button type="submit" className="create-event-submit" disabled={salje}>
                {salje ? 'Pravim...' : 'Napravi'}
              </button>
              <button type="button" className="create-event-cancel" onClick={onZatvori}>Otkazi</button>
            </div>
          </form>
        </div>{/*create-event-card end*/}
      </div>{/*create-event-modal end*/}
    </div>
  )
}

export default NapraviDogadjaj



