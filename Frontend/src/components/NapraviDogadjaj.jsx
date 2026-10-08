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
import { toast } from 'react-toastify';

// dogadjaj = null: pravljenje novog. dogadjaj = {...}: izmena postojeceg (polja su popunjena,
// cuva se PUT-om, onKreiran dobija izmenjen dogadjaj). Za izmenu se komponenta montira tek
// kad se otvara, pa pocetne vrednosti (i marker na mapi) dolaze iz dogadjaja.
function NapraviDogadjaj({ otvorena = false, onZatvori = () => {}, onKreiran = () => {}, dogadjaj: postojeci = null }) {
  const izmena = postojeci != null;
  const pid = izmena ? 'cei' : 'ced'; // prefiks id-jeva, da se ne sudare sa formom za novi dogadjaj


  registerLocale("sr-Latn", srLatn);  

const [naslov, setNaslov] = useState(postojeci?.naslov ?? '');
const [kategorija, setKategorija] = useState(postojeci?.kategorija ?? 'Ostalo');
const [slika, setSlika] = useState(null);
const [ukloniSliku, setUkloniSliku] = useState(false); // samo pri izmeni: skloni postojecu sliku
const [datumDogadjaja, setDatumDogadjaja] = useState(() => {
  if (!postojeci?.datum_Dogadjaja) return '';
  const d = new Date(postojeci.datum_Dogadjaja);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
});
const [vremePocetka, setVremePocetka] = useState(postojeci?.vreme_pocetka ?? '');
const [opis, setOpis] = useState(postojeci?.opis ?? '');
const [x, setX] = useState(postojeci?.x ?? '');
const [y, setY] = useState(postojeci?.y ?? '');
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
    const telo = {
      naslov: naslov.trim(),
      opis: opis.trim(),
      kategorija,
      // format(..., 'yyyy-MM-dd') a ne toISOString() - potonji racuna u UTC i oko ponoci pomera dan
      datumDogadjaja: format(datumDogadjaja, 'yyyy-MM-dd'),
      vremePocetka,
      x,
      y,
    };
    const dogadjaj = izmena
      ? await api.put(`/Dogadjaj/IzmeniDogadjaj/${postojeci.id}`, telo)
      : await api.post('/Dogadjaj/DodajDogadjaj', telo);

    if (izmena && ukloniSliku && !slika && dogadjaj.dogadjajImage) {
      await api.del(`/Dogadjaj/IzbrisiSlikuDogadjaja/${dogadjaj.id}`);
      dogadjaj.dogadjajImage = null;
    }

    if (slika) {
      const formData = new FormData();
      formData.append('fajl', slika);
      try {
        const { slika: ime } = await api.post(`/Dogadjaj/DodajSlikuDogadjaju?dogadjaj_id=${dogadjaj.id}`, formData);
        dogadjaj.dogadjajImage = ime;
      } catch (error) {
        // Dogadjaj je napravljen, samo slika nije prosla - ne brisemo ga, javimo
        toast.warn(`Dogadjaj je ${izmena ? 'sacuvan' : 'napravljen'}, ali slika nije sacuvana: ` + (error instanceof ApiError ? error.message : error));
      }
    }

    if (!izmena) resetujFormu();
    onZatvori();
    onKreiran(dogadjaj);
  } catch (error) {
    if (error instanceof ApiError && error.data?.greske) {
      setGreske(error.data.greske); // server je odbio neko polje - prikazi ispod tog polja
    } else {
      const poruka = error instanceof ApiError ? error.message : String(error);
      console.error('Kreiranje dogadjaja nije uspelo:', poruka);
      setGreske({ opste: `${izmena ? 'Cuvanje' : 'Kreiranje'} dogadjaja nije uspelo. Pokusajte ponovo.` });
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

// Iste granice kao na serveru (FileService): JPG/PNG/WEBP do 5 MB
const handleSlikaChange = (e) => {
  const fajl = e.target.files[0];
  e.target.value = '';
  if (!fajl) return;
  const greska = !['image/jpeg', 'image/png', 'image/webp'].includes(fajl.type)
    ? 'Dozvoljene su samo JPG, PNG i WEBP slike.'
    : fajl.size > 5 * 1024 * 1024 ? 'Slika moze imati najvise 5 MB.' : null;
  setGreske((g) => ({ ...g, slika: greska }));
  setSlika(greska ? null : fajl);
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
        id={izmena ? undefined : 'forma'}
        onClick={handleOverlayClick}
      >
        <div className="create-event-card">
          <div className="create-event-header">
            <h3>{izmena ? 'Izmeni dogadjaj' : 'Napravi dogadjaj'}</h3>
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
              <label htmlFor={`${pid}-naziv`}>Naziv</label>
              <input
                id={`${pid}-naziv`}
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
                <label htmlFor={`${pid}-kategorija`}>Kategorija</label>
                <select
                  id={`${pid}-kategorija`}
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
                <label htmlFor={`${pid}-slika`}>Slika</label>
                <label htmlFor={`${pid}-slika`} className="create-event-file">
                  <i className="la la-image" />
                  <span>{slika ? slika.name : izmena && postojeci.dogadjajImage && !ukloniSliku ? 'Zameni sliku...' : 'Dodaj sliku...'}</span>
                </label>
                <input
                  id={`${pid}-slika`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleSlikaChange}
                  hidden
                />
                {greske.slika && <span className="create-event-error">{greske.slika}</span>}
                {izmena && postojeci.dogadjajImage && !slika && (
                  <label className="izmena-profila-check">
                    <input type="checkbox" checked={ukloniSliku} onChange={(e) => setUkloniSliku(e.target.checked)} />
                    Ukloni postojecu sliku
                  </label>
                )}
              </div>
            </div>

            <div className="create-event-row">
              <div className="create-event-field">
                <label htmlFor={`${pid}-datum`}>Datum</label>
                <DatePicker
                  id={`${pid}-datum`}
                  selected={datumDogadjaja}
                  onChange={handleDatePickerChange}
                  locale="sr-Latn"
                  minDate={izmena && datumDogadjaja instanceof Date && datumDogadjaja < new Date() ? datumDogadjaja : new Date()}
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
              <label htmlFor={`${pid}-opis`}>Opis</label>
              <textarea
                id={`${pid}-opis`}
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
                {salje ? (izmena ? 'Cuvam...' : 'Pravim...') : (izmena ? 'Sacuvaj' : 'Napravi')}
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



