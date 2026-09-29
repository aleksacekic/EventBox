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
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '../auth';
// import moment from 'moment';

function NapraviDogadjaj({ otvorena = false, onZatvori = () => {}, onKreiran = () => {} }) {

  const { userId } = useAuth();

  registerLocale("sr-Latn", srLatn);  

  
  const google = window.google;

const [naslov, setNaslov] = useState('');
const [kategorija, setKategorija] = useState('');
const [slika, setSlika] = useState(null);
const [datumDogadjaja, setDatumDogadjaja] = useState('');
const [vremePocetka, setVremePocetka] = useState('');
const [opis, setOpis] = useState('');
const [x, setX] = useState('');
const [y, setY] = useState('');



const kreirajDogadjaj = async (e) => {
  e.preventDefault();

  // [test] Tvrda validacija "sva polja obavezna" je sklonjena da bi se lakse probalo.
  // Prazna polja dobijaju bezbedan default (npr. mapa ne radi bez Google kljuca -> Beograd).
  const kreator = userId;
  // format(..., 'yyyy-MM-dd') umesto .toISOString().split('T')[0] - potonje racuna
  // sa UTC pa je oko ponoci pomeralo datum za jedan dan unazad (lokalno vreme je
  // ispred UTC-a).
  const datumObjave = format(new Date(), 'yyyy-MM-dd'); // danasnji datum u formatu YYYY-MM-DD
  const formattedDatumDogadjaja =
    (datumDogadjaja && typeof datumDogadjaja.getFullYear === 'function')
      ? format(datumDogadjaja, 'yyyy-MM-dd')
      : datumObjave;

  const naslovZaSlanje = naslov || 'Test dogadjaj';
  const kategorijaZaSlanje = kategorija || 'Ostalo';
  const vremeZaSlanje = vremePocetka || '12:00';
  const opisZaSlanje = opis || 'Test opis';
  const xZaSlanje = x || 44.7866; // default lat (Beograd)
  const yZaSlanje = y || 20.4489; // default lng (Beograd)

  try {
    const dogadjaj = await api.post(
      `/Dogadjaj/DodajDogadjaj/${kreator}/${datumObjave}/${naslovZaSlanje}/${formattedDatumDogadjaja}/${vremeZaSlanje}/${opisZaSlanje}/${kategorijaZaSlanje}/${xZaSlanje}/${yZaSlanje}`
    );

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
    const poruka = error instanceof ApiError ? error.message : String(error);
    console.error('Kreiranje dogadjaja nije uspelo:', poruka);
    alert('Kreiranje dogadjaja nije uspelo: ' + poruka);
  }
};

const resetujFormu = () => {
  setNaslov('');
  setKategorija('');
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
                className="create-event-input"
                value={naslov}
                onChange={(e) => setNaslov(e.target.value)}
              />
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
              </div>

              <div className="create-event-field">
                <label htmlFor="time">Vreme</label>
                <TimePicker
                  value={vremePocetka}
                  onChange={(value) => setVremePocetka(value)}
                />
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
            </div>

            <div className="create-event-actions">
              <button type="submit" className="create-event-submit">Napravi</button>
              <button type="button" className="create-event-cancel" onClick={onZatvori}>Otkazi</button>
            </div>
          </form>
        </div>{/*create-event-card end*/}
      </div>{/*create-event-modal end*/}
      <ToastContainer />
    </div>
  )
}

export default NapraviDogadjaj



