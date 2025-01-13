import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState} from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import TimePicker from './TimePicker'
import Map from './Mapa.js'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Cookies from 'js-cookie'
// import moment from 'moment';

function NapraviDogadjaj() {

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

  if (!naslov || !kategorija || !datumDogadjaja || !vremePocetka || !opis || !x || !y) {
    toast.error('Sva polja moraju biti popunjena!', {
      position: toast.POSITION.TOP_CENTER,
      className: 'toast-message'
    });
    return;
  }

  // const kreator = 2; // Hardkodirani kreator
  const kreator = Cookies.get('userID');
  const datumObjave = new Date().toISOString().split('T')[0]; // danasnji datum u formatu YYYY-MM-DD
  const formattedDatumDogadjaja = datumDogadjaja.toISOString().split('T')[0]; //lepo isece datum dogadjaja

  try {
    
    const response = await fetch(`http://localhost:5153/Dogadjaj/DodajDogadjaj/${kreator}/${datumObjave}/${naslov}/${formattedDatumDogadjaja}/${vremePocetka}/${opis}/${kategorija}/${x}/${y}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log(response);
    if (response.ok) { // response.ok
      console.log(response);
      //console.log(await response.text())
      //const dogadjajId = await response.json();// OVDE UZIMAMO ID OD OBJAVE KOJU SMO NAPRAVILI FETCHEM IZNAD
      const responseData = await response.json();
      const dogadjajId = responseData.id;
      //console.log(dogadjajId);
      let formData = new FormData();
      formData.append('fajl', slika);
      
      let risponz = await fetch(`http://localhost:5153/Dogadjaj/DodajSlikuDogadjaju?dogadjaj_id=${dogadjajId}`, {
        method: 'POST',
        body: formData
      })
        .then((res) => res.json())
        .then((data) => {
          console.log(data);
          // Obrada odgovora
          setSlika((prevKorisnik) => ({ ...prevKorisnik, slika: data.Message }));
          window.location.reload();
          setSlika(null);
        })
        .catch((error) => {
          console.log("Došlo je do greške prilikom izvršavanja zahteva:", error);
          // Dodajte dalju logiku ili manipulaciju prema potrebi
        });
      console.log(risponz);
    }
  } catch (error) {
    console.error(error);
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
      <div className="post-popup job_post" id="forma">
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
                    {/* <li><a href="#" onClick={zatvoriFormu}>Otkazi</a></li> */}
                    <li><a href="#" >Otkazi</a></li>
                  </ul>
                </div>
              </div></form>
          </div>{/*post-project-fields end*/}
          <a href="#" ><i className="la la-times-circle-o" /></a>
        </div>{/*post-project end*/}
      </div>{/*post-project-popup end*/}
      <ToastContainer />
    </div>
  )
}

export default NapraviDogadjaj



