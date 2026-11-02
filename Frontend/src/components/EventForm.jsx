import { api, ApiError } from '../api';
import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next';
import { datePickerLocale, datePickerFormat } from '../utils/date';
import { CATEGORIES } from '../utils/event';
import { format } from 'date-fns';
import TimePicker from './TimePicker'
import LocationPicker from './LocationPicker'
import { toast } from 'react-toastify';

// dogadjaj = null: pravljenje novog. dogadjaj = {...}: izmena postojeceg (polja su popunjena,
// cuva se PUT-om, onSaved dobija izmenjen dogadjaj). Za izmenu se komponenta montira tek
// kad se otvara, pa pocetne vrednosti (i marker na mapi) dolaze iz dogadjaja.
function EventForm({ otvorena = false, onClose = () => {}, onSaved = () => {}, dogadjaj: postojeci = null }) {
  const izmena = postojeci != null;
  const pid = izmena ? 'cei' : 'ced'; // prefiks id-jeva, da se ne sudare sa formom za novi dogadjaj


  const { t } = useTranslation();

const [naslov, setNaslov] = useState(postojeci?.title ?? '');
const [kategorija, setKategorija] = useState(postojeci?.category ?? 'Ostalo');
const [slika, setSlika] = useState(null);
const [ukloniSliku, setUkloniSliku] = useState(false); // samo pri izmeni: skloni postojecu sliku
const [datumDogadjaja, setDatumDogadjaja] = useState(() => {
  if (!postojeci?.date) return '';
  const d = new Date(postojeci.date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
});
const [vremePocetka, setVremePocetka] = useState(postojeci?.startTime ?? '');
const [opis, setOpis] = useState(postojeci?.description ?? '');
const [x, setX] = useState(postojeci?.latitude ?? '');
const [y, setY] = useState(postojeci?.longitude ?? '');
const [greske, setGreske] = useState({}); // polje -> poruka (iste provere kao na serveru)
const [salje, setSalje] = useState(false);



// Iste provere kao EventRequest.Validate na serveru - ovde samo da korisnik odmah vidi gresku
const validate = () => {
  const g = {};
  const n = naslov.trim();
  if (n.length < 3 || n.length > 100) g.title = t('eventForm.errors.title');
  if (!(datumDogadjaja instanceof Date)) g.date = t('eventForm.errors.date');
  if (!vremePocetka) g.startTime = t('eventForm.errors.time');
  if (x === '' || y === '') g.location = t('eventForm.errors.location');
  return g;
};

const handleSubmit = async (e) => {
  e.preventDefault();
  const g = validate();
  setGreske(g);
  if (Object.keys(g).length > 0 || salje) return;

  setSalje(true);
  try {
    // Sve ide u telu zahteva; kreatora i datum objave postavlja server
    const telo = {
      title: naslov.trim(),
      description: opis.trim(),
      category: kategorija,
      // format(..., 'yyyy-MM-dd') a ne toISOString() - potonji racuna u UTC i oko ponoci pomera dan
      date: format(datumDogadjaja, 'yyyy-MM-dd'),
      startTime: vremePocetka,
      latitude: x,
      longitude: y,
    };
    const dogadjaj = izmena
      ? await api.put(`/api/events/${postojeci.id}`, telo)
      : await api.post('/api/events', telo);

    if (izmena && ukloniSliku && !slika && dogadjaj.image) {
      await api.del(`/api/events/${dogadjaj.id}/image`);
      dogadjaj.image = null;
    }

    if (slika) {
      const formData = new FormData();
      formData.append('file', slika);
      try {
        const { image: ime } = await api.put(`/api/events/${dogadjaj.id}/image`, formData);
        dogadjaj.image = ime;
      } catch (error) {
        // Dogadjaj je napravljen, samo slika nije prosla - ne brisemo ga, javimo
        toast.warn(t(izmena ? 'eventForm.savedNoImage' : 'eventForm.createdNoImage', { error: error instanceof ApiError ? error.message : String(error) }));
      }
    }

    if (!izmena) resetForm();
    onClose();
    onSaved(dogadjaj);
  } catch (error) {
    if (error instanceof ApiError && error.data?.errors) {
      setGreske(error.data.errors); // server je odbio neko polje - prikazi ispod tog polja
    } else {
      const poruka = error instanceof ApiError ? error.message : String(error);
      console.error('Kreiranje dogadjaja nije uspelo:', poruka);
      setGreske({ general: t(izmena ? 'eventForm.saveFailed' : 'eventForm.createFailed') });
    }
  } finally {
    setSalje(false);
  }
};

const resetForm = () => {
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

const handleLocationChange = (latitude, longitude) => {
  setX(latitude);
  setY(longitude);
};

// Iste granice kao na serveru (FileService): JPG/PNG/WEBP do 5 MB
const handleImageChange = (e) => {
  const fajl = e.target.files[0];
  e.target.value = '';
  if (!fajl) return;
  const greska = !['image/jpeg', 'image/png', 'image/webp'].includes(fajl.type)
    ? t('validation.imageType')
    : fajl.size > 5 * 1024 * 1024 ? t('validation.imageSize') : null;
  setGreske((g) => ({ ...g, image: greska }));
  setSlika(greska ? null : fajl);
};

// ESC zatvara formu dok je otvorena
useEffect(() => {
  if (!otvorena) return;
  const handleEsc = (e) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [otvorena, onClose]);

// Klik van kartice (na tamni overlay) zatvara formu
const handleOverlayClick = useCallback((e) => {
  if (e.target === e.currentTarget) onClose();
}, [onClose]);

  return (
    <div>
      <div
        className={`create-event-modal ${otvorena ? 'is-open' : ''}`}
        id={izmena ? undefined : 'forma'}
        onClick={handleOverlayClick}
      >
        <div className="create-event-card">
          <div className="create-event-header">
            <h3>{izmena ? t('eventForm.editTitle') : t('eventForm.createTitle')}</h3>
            <button
              type="button"
              className="create-event-close"
              onClick={onClose}
              aria-label={t('common.close')}
            >
              <i className="la la-times" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="create-event-form">
            <div className="create-event-field">
              <label htmlFor={`${pid}-naziv`}>{t('eventForm.title')}</label>
              <input
                id={`${pid}-naziv`}
                type="text"
                name="title"
                placeholder={t('eventForm.titlePlaceholder')}
                className={`create-event-input ${greske.title ? 'create-event-input-invalid' : ''}`}
                maxLength={100}
                value={naslov}
                onChange={(e) => setNaslov(e.target.value)}
              />
              {greske.title && <span className="create-event-error">{greske.title}</span>}
            </div>

            <div className="create-event-row">
              <div className="create-event-field">
                <label htmlFor={`${pid}-kategorija`}>{t('eventForm.category')}</label>
                <select
                  id={`${pid}-kategorija`}
                  className="create-event-input create-event-select"
                  value={kategorija}
                  onChange={(e) => setKategorija(e.target.value)}
                >
                  {CATEGORIES.map((k) => (
                    <option key={k} value={k}>{t(`categories.${k}`)}</option>
                  ))}
                </select>
                {greske.category && <span className="create-event-error">{greske.category}</span>}
              </div>

              <div className="create-event-field">
                <label htmlFor={`${pid}-slika`}>{t('eventForm.image')}</label>
                <label htmlFor={`${pid}-slika`} className="create-event-file">
                  <i className="la la-image" />
                  <span>{slika ? slika.name : izmena && postojeci.image && !ukloniSliku ? t('eventForm.replaceImage') : t('eventForm.addImage')}</span>
                </label>
                <input
                  id={`${pid}-slika`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  hidden
                />
                {greske.image && <span className="create-event-error">{greske.image}</span>}
                {izmena && postojeci.image && !slika && (
                  <label className="izmena-profila-check">
                    <input type="checkbox" checked={ukloniSliku} onChange={(e) => setUkloniSliku(e.target.checked)} />
                    {t('eventForm.removeImage')}
                  </label>
                )}
              </div>
            </div>

            <div className="create-event-row">
              <div className="create-event-field">
                <label htmlFor={`${pid}-datum`}>{t('eventForm.date')}</label>
                <DatePicker
                  id={`${pid}-datum`}
                  selected={datumDogadjaja}
                  onChange={handleDatePickerChange}
                  locale={datePickerLocale()}
                  minDate={izmena && datumDogadjaja instanceof Date && datumDogadjaja < new Date() ? datumDogadjaja : new Date()}
                  dateFormat={datePickerFormat()}
                  calendarClassName="eb-calendar"
                  dayClassName={(date) =>
                    date.getDay() === 0 || date.getDay() === 6 ? "weekend-day" : ""
                  }
                  placeholderText={t('eventForm.pickDate')}
                  className="create-event-input"
                  wrapperClassName="create-event-date-wrapper"
                />
                {greske.date && <span className="create-event-error">{greske.date}</span>}
              </div>

              <div className="create-event-field">
                <label htmlFor="time">{t('eventForm.time')}</label>
                <TimePicker
                  value={vremePocetka}
                  onChange={(value) => setVremePocetka(value)}
                />
                {greske.startTime && <span className="create-event-error">{greske.startTime}</span>}
              </div>
            </div>

            <div className="create-event-field">
              <label>{t('eventForm.location')}</label>
              <div className="create-event-map">
                <LocationPicker
                  x={x}
                  y={y}
                  onLocationChange={handleLocationChange}
                />
              </div>
              {greske.location && <span className="create-event-error">{greske.location}</span>}
            </div>

            <div className="create-event-field">
              <label htmlFor={`${pid}-opis`}>{t('eventForm.description')}</label>
              <textarea
                id={`${pid}-opis`}
                name="description"
                placeholder={t('eventForm.descriptionPlaceholder')}
                className="create-event-input create-event-textarea"
                maxLength={200}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
              />
              {greske.description && <span className="create-event-error">{greske.description}</span>}
            </div>

            {greske.general && <span className="create-event-error">{greske.general}</span>}
            <div className="create-event-actions">
              <button type="submit" className="create-event-submit" disabled={salje}>
                {salje ? (izmena ? t('common.saving') : t('eventForm.creating')) : (izmena ? t('common.save') : t('eventForm.create'))}
              </button>
              <button type="button" className="create-event-cancel" onClick={onClose}>{t('common.cancel')}</button>
            </div>
          </form>
        </div>{/*create-event-card end*/}
      </div>{/*create-event-modal end*/}
    </div>
  )
}

export default EventForm



