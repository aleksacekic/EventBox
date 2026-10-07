import { api, API_BASE } from '../api';
import React from 'react'
import { useState,useEffect } from 'react';
import HideShowMapa from './Hide&ShowMapa';
import Komentari from './Komentari';
import Reakcije from './Reakcije'
import { format } from 'date-fns';
import Main from './Main';
import moment from 'moment';
import Razlog from './Razlog';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';

function Pr_Dog() {

  const google = window.google;

  function otvoriDiv(event, id) {
    event.preventDefault(); 
    var div = document.getElementById(id);
          if (div.style.display === "none") {
              div.style.display = "block";
          } 
          else {
              div.style.display = "none";
          }
  }


  const BlokirajFunc = async (ID) => {

    //stize mi id kreatora
    await api.put(`/Korisnik/BlokirajKorisnika/${ID}`);
    alert("Kreator dogadjaja je uspesno blokiran");

  }

  

  const ObrisiFunc = async (ID_PR, ID_DOG) => {

      // Brisanje dogadjaja kaskadno brise i njegovu prijavu sa razlozima
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${ID_DOG}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(d => d.id !== ID_PR))
      alert("Dogadjaj je izbacen iz polja ");
    
  }

  const IgnorisiFunc = async (ID_PR, ID_DOG) => {

      // Razlozi se brisu kaskadno zajedno sa prijavom
      await api.del(`/Pr_dog/IzbrisiPrijavljeniDogadjaj/${ID_PR}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(d => d.id !== ID_PR))
      alert("Dogadjaj je izbacen iz polja ");
  }
  

    // Prijave se ucitavaju 4 po 4 kako admin skroluje (vidi useBeskonacnaLista)
    const lista = useBeskonacnaLista('/Pr_dog/VratiPrijavljene_dog', { limit: 4 });
    const dogadjaji = lista.stavke;
    const setDogadjaji = lista.setStavke;

    return (
      <div className='pr_dog_klasa' onClick={(e) => { e.stopPropagation(); }}>
        <div className='job_descp2'>
          <h2 className="prijavljeniadminutext">PRIJAVLJENI DOGAĐAJI</h2>
        </div>
        {dogadjaji.map(dogadjaj => (
          <div className="post-bar" key={dogadjaj.dogadjaj_Id.id}>
            <div className="post_topbar" >
              <div className="usy-dt">
                <div className="usy-name">
                  <h3>{dogadjaj.dogadjaj_Id.userName_Kreatora}</h3>
                  <span><img src="/images/clock.png" />{new Date(dogadjaj.dogadjaj_Id.datum_Objave).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="ed-opts">
                <a href="#" className="ed-opts-open"><i className="la la-ellipsis-v" /></a>
                <ul className="ed-options">
                  <li><a href="#" >Edit Post</a></li>
                  <li><a href="#">Close</a></li>
                  <li><a href="#">Hide</a></li>
                </ul>
              </div>
            </div>
            <div className="job_descp">
              <h3>{dogadjaj.dogadjaj_Id.naslov}</h3>
              <ul className="job-dt">
                <li><a href="#">{dogadjaj.dogadjaj_Id.kategorija}</a></li>
                <li><span>{new Date(dogadjaj.dogadjaj_Id.datum_Dogadjaja).toLocaleDateString()} od {dogadjaj.dogadjaj_Id.vreme_pocetka}</span></li>
              </ul>
              <p>{dogadjaj.dogadjaj_Id.opis}</p>
              {dogadjaj.dogadjaj_Id.dogadjajImage && (
                <img src={`${API_BASE}/resources/${dogadjaj.dogadjaj_Id.dogadjajImage}`} className='rounded float-left dogadjaj-slika' />
              )}
              <HideShowMapa
                latitude={dogadjaj.dogadjaj_Id.x}
                longitude={dogadjaj.dogadjaj_Id.y}
              />
              <p>Broj prijava: <span>{dogadjaj.broj_prijava}</span></p>
            </div>
            <div className="job-status-bar">
              <ul className="like-com d-flex">
                <li className="komentardiv" onClick={(event) => otvoriDiv(event, dogadjaj.dogadjaj_Id.id)}>
                  <img src="/images/com.png" className="com-slika" />
                  <a href="#" className="com">Razlozi</a>
                </li>
                <li className="prijavidiv" onClick={() => BlokirajFunc(dogadjaj.dogadjaj_Id.iD_Kreatora)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Blokiraj</a>
                </li>
                <li className="prijavidiv" onClick={() => ObrisiFunc(dogadjaj.id, dogadjaj.dogadjaj_Id.id)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Obriši</a>
                </li>
                <li className="prijavidiv" onClick={() => IgnorisiFunc(dogadjaj.id, dogadjaj.dogadjaj_Id.id)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Ignoriši</a>
                </li>
              </ul>
            </div>
            <div className="comment-section" style={{ display: 'none' }} id={dogadjaj.dogadjaj_Id.id}>
              <Razlog jedan_dog={dogadjaj} />
            </div>
          </div>))}
        <KrajListe lista={lista} />
      </div>
    );
  
}

export default Pr_Dog;