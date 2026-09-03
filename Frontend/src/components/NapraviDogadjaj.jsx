import { api, ApiError } from '../api';
import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState} from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import TimePicker from './TimePicker'
import Map from './Mapa'
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie'
// import moment from 'moment';

function NapraviDogadjaj({ otvorena = false, onZatvori = () => {} }) {

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
  const kreator = Cookies.get('userID');
  const datumObjave = new Date().toISOString().split('T')[0]; // danasnji datum u formatu YYYY-MM-DD
  const formattedDatumDogadjaja =
    (datumDogadjaja && typeof datumDogadjaja.toISOString === 'function')
      ? datumDogadjaja.toISOString().split('T')[0]
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
      await api.post(`/Dogadjaj/DodajSlikuDogadjaju?dogadjaj_id=${dogadjaj.id}`, formData);
    }

    window.location.reload();
  } catch (error) {
    const poruka = error instanceof ApiError ? error.message : String(error);
    console.error('Kreiranje dogadjaja nije uspelo:', poruka);
    alert('Kreiranje dogadjaja nije uspelo: ' + poruka);
  }
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

  return (
    <div>
      <div className={`post-popup job_post ${otvorena ? 'active' : ''}`} id="forma">
        <div className="post-project">
          <h3>Napravi dogadjaj</h3>
          <div className="post-project-fields">
            <form onSubmit={kreirajDogadjaj}>
              <div className="row">
                <div className="col-lg-12">
                  <input type="text" name="title" placeholder="Naziv" value={naslov} onChange={(e) => setNaslov(e.target.value)} 
                    />
                </div>
                <div className="col-lg-6">
                  <div className="inp-field">
                    <select
                      value={kategorija} onChange={(e) => setKategorija(e.target.value)}
                      >
                      <option>Ostalo</option>
                      <option>Zurka</option>
                      <option>Humanitarna akcija</option>
                      <option>Ekoloska akcija</option>
                      <option>Sportski dogadjaj</option>
                      <option>Koncert</option>
                      
                    </select>
                  </div>
                </div>
                {/* <div class="col-lg-6">
      								<form>
      									<div class="input-group mb-3">
      										<input type="file" class="form-control" id="inputFile" accept="image/*" multiple>
      										<label class="input-group-text" for="inputFile">Dodaj slike</label> 
      									</div>
      								</form>
      							</div> */}
                <div className="col-lg-6">
                  <div className="input-group mb-3">
                    <label className="input-group-text">Dodaj sliku ➞</label>
                    <input type="file" className="form-control" id="inputFile" accept="image/*" onChange={handleSlikaChange}/> 
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="price-br">
                  <DatePicker
                      selected={datumDogadjaja}
                      onChange={handleDatePickerChange}
                      
                      locale="sr-Latn" //srpski jezik
                      minDate={new Date()}
                      dateFormat="yyyy.MM.dd" 
                      dayClassName={(date) =>
                        date.getDay() === 0 || date.getDay() === 6 ? "weekend-day": ""
                      } 
                      //selected={date}
                      placeholderText="Izaberite datum"
                    />              
                  </div>
                    
                </div>
                <div className="col-lg-6">
                  <div>
                    <TimePicker
                    value={vremePocetka}
                    onChange={(value) => setVremePocetka(value)}
                    />
                  </div>
                </div>
                {/* POSTAVLJANJE MAPE */}
                <div id="map" className="col-lg-12">
                      <Map 
                      x={x}
                      y={y}
                     onMapMarker={handleMapMarker}
                      />
                </div>

                <div className="col-lg-12 postaviopisdogadjaja">
                  <textarea name="description" placeholder="Opis dogadjaja (max 200 karaktera)" className="opisdogadjaja" maxLength={200}
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                    />
                </div>
                <div className="col-lg-12 zzatvaranje">
                  <ul>
                    <li><button className="active" type="submit" value="post">Napravi</button></li>
                    <li><a href="#" onClick={(e) => { e.preventDefault(); onZatvori(); }}>Otkazi</a></li>
                  </ul>
                </div>
              </div></form>
          </div>{/*post-project-fields end*/}
          <a href="#" onClick={(e) => { e.preventDefault(); onZatvori(); }}><i className="la la-times-circle-o" /></a>
        </div>{/*post-project end*/}
      </div>{/*post-project-popup end*/}
      <ToastContainer />
    </div>
  )
}

export default NapraviDogadjaj



