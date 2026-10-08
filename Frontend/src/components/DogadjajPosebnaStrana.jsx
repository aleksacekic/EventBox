import { api } from '../api';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react'
import DogadjajKartica from './DogadjajKartica';
import { formatDatum } from '../utils/datum';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';

// Deep-link strana za jedan dogadjaj (/objava/:id) - otvara se i direktnim
// linkom / iz chata / refreshom, ne samo klikom iz feeda. Zato NE zavisi od
// location.state (kao pre) - sve sto joj treba (dogadjaj, ulogovani korisnik)
// sama dovuce preko :id i useAuth().
function DogadjajPosebnaStrana() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { ucitajNotifikacije } = useNotifications();

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
          formattedDatum: formatDatum(data.datum_Objave),
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
      ucitajNotifikacije(); // backend je obrisao i notifikacije tog dogadjaja
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
      <div className="container dogadjaj-standalone">
        <div className="dogadjaj-standalone-inner">
          <button onClick={handleBackClick} className="dogadjaj-standalone-back">
            <i className="la la-arrow-left" />
            Povratak na pocetnu
          </button>
          <p>Ovaj dogadjaj ne postoji ili je obrisan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container dogadjaj-standalone">
      <div className="dogadjaj-standalone-inner">
        <button onClick={handleBackClick} className="dogadjaj-standalone-back">
          <i className="la la-arrow-left" />
          Povratak na pocetnu
        </button>
        <DogadjajKartica
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onObrisi={obrisiObjavu}
          className="dogadjaj-card dogadjaj-card-standalone"
        />
      </div>
    </div>
  );
}

export default DogadjajPosebnaStrana;
