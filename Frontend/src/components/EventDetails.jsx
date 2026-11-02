import { api } from '../api';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react'
import EventCard from './EventCard';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { useTranslation } from 'react-i18next';

// Deep-link strana za jedan dogadjaj (/objava/:id) - otvara se i direktnim
// linkom / iz chata / refreshom, ne samo klikom iz feeda. Zato NE zavisi od
// location.state (kao pre) - sve sto joj treba (dogadjaj, ulogovani korisnik)
// sama dovuce preko :id i useAuth().
function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { loadNotifications } = useNotifications();
  const { t } = useTranslation();

  const [dogadjaj, setDogadjaj] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true);
  const [nijeNadjen, setNijeNadjen] = useState(false);

  const [korisnik, setKorisnik] = useState(null);

  const handleBackClick = () => {
    navigate(-1);
  };

  useEffect(() => {
    let otkazano = false;

    const loadEvent = async () => {
      setUcitavaSe(true);
      setNijeNadjen(false);
      try {
        const data = await api.get(`/api/events/${id}`);
        if (otkazano) return;
        setDogadjaj(data);
      } catch (error) {
        console.error('Greska pri dohvatanju dogadjaja:', error);
        if (!otkazano) setNijeNadjen(true);
      } finally {
        if (!otkazano) setUcitavaSe(false);
      }
    };

    loadEvent();
    return () => { otkazano = true; };
  }, [id]);

  useEffect(() => {
    if (!userId) return;

    const loadUser = async () => {
      try {
        const data = await api.get(`/api/users/${userId}`);
        setKorisnik(data);
      } catch (error) {
        console.error('Greska pri dohvatanju korisnika:', error);
      }
    };

    loadUser();
  }, [userId]);

  // BRISANJE OBJAVE - ovde nema liste iz koje da se ukloni, pa nakon brisanja
  // vracamo korisnika na feed
  const handleDeleteEvent = async (dogadjajId) => {
    try {
      await api.del(`/api/events/${dogadjajId}`);
      loadNotifications(); // backend je obrisao i notifikacije tog dogadjaja
      navigate('/pocetna');
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
  };

  if (ucitavaSe || !korisnik) {
    return <p>{t('common.loading')}</p>;
  }

  if (nijeNadjen || !dogadjaj) {
    return (
      <div className="container dogadjaj-standalone">
        <div className="dogadjaj-standalone-inner">
          <button onClick={handleBackClick} className="dogadjaj-standalone-back">
            <i className="la la-arrow-left" />
            {t('events.backHome')}
          </button>
          <p>{t('events.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container dogadjaj-standalone">
      <div className="dogadjaj-standalone-inner">
        <button onClick={handleBackClick} className="dogadjaj-standalone-back">
          <i className="la la-arrow-left" />
          {t('events.backHome')}
        </button>
        <EventCard
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onDelete={handleDeleteEvent}
          className="dogadjaj-card dogadjaj-card-standalone"
        />
      </div>
    </div>
  );
}

export default EventDetails;
