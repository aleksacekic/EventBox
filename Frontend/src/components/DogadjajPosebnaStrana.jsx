import { api } from '../api';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react'
import DogadjajKartica from './DogadjajKartica';
import moment from 'moment';
import { useAuth } from '../auth';

// Deep-link strana za jedan dogadjaj (/objava/:id) - otvara se i direktnim
// linkom / iz chata / refreshom, ne samo klikom iz feeda. Zato NE zavisi od
// location.state (kao pre) - sve sto joj treba (dogadjaj, ulogovani korisnik)
// sama dovuce preko :id i useAuth().
function DogadjajPosebnaStrana() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [dogadjaj, setDogadjaj] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true);
  const [nijeNadjen, setNijeNadjen] = useState(false);

  const [korisnik, setKorisnik] = useState(null);

  const handleBackClick = () => {
    navigate(-1);
  };

  useEffect(() => {
    let otkazano = false;

    const ucitaj = async () => {
      setUcitavaSe(true);
      setNijeNadjen(false);
      try {
        const data = await api.get(`/Dogadjaj/VratiDogadjaj/${id}`);
        if (otkazano) return;
        setDogadjaj({
          ...data,
          formattedDatum: moment(data.datum_Objave).format('DD.MM.YYYY'),
        });
      } catch (error) {
        console.error('Greska pri dohvatanju dogadjaja:', error);
        if (!otkazano) setNijeNadjen(true);
      } finally {
        if (!otkazano) setUcitavaSe(false);
      }
    };

    ucitaj();
    return () => { otkazano = true; };
  }, [id]);

  useEffect(() => {
    if (!userId) return;

    const ucitajKorisnika = async () => {
      try {
        const data = await api.get(`/Korisnik/VratiKorisnika_ID/${userId}`);
        setKorisnik(data);
      } catch (error) {
        console.error('Greska pri dohvatanju korisnika:', error);
      }
    };

    ucitajKorisnika();
  }, [userId]);

  // BRISANJE OBJAVE - ovde nema liste iz koje da se ukloni, pa nakon brisanja
  // vracamo korisnika na feed
  const obrisiObjavu = async (dogadjajId) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${dogadjajId}`);
      navigate('/pocetna');
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
  };

  if (ucitavaSe || !korisnik) {
    return <p>Učitavanje...</p>;
  }

  if (nijeNadjen || !dogadjaj) {
    return (
      <div className="col-lg-6 col-md-8 no-pd">
        <div className="main-ws-sec">
          <button onClick={handleBackClick} className="back-btn">
            <i className="la la-arrow-left ikonicaback"></i>
          </button>
          <p>Ovaj dogadjaj ne postoji ili je obrisan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="col-lg-6 col-md-8 no-pd">
      <div className="main-ws-sec">
        <button onClick={handleBackClick} className="back-btn">
          <i className="la la-arrow-left ikonicaback"></i>
        </button>
        <DogadjajKartica
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onObrisi={obrisiObjavu}
          className="post-barALTERNATIVE"
        />
      </div>
    </div>
  );
}

export default DogadjajPosebnaStrana;
