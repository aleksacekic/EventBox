import { api } from '../api';
import React from 'react'
import { useState, useEffect } from 'react';
import EventCard from './EventCard';
import InfiniteScrollFooter from './InfiniteScrollFooter';
import { useInfiniteList } from '../useInfiniteList';
import { formatDate } from '../utils/date';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { useNavigate } from 'react-router-dom';


// Main.jsx koristi ovaj datum kao "datum nije izabran"
const NEMA_DATUMA = new Date("2000-01-01").getTime();

const withFormattedDate = (d) => ({
  ...d,
  formattedDatum: formatDate(d.datum_Objave),
});

function EventFeed({ primljenDatum, primljenNaziv, noviDogadjaj }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { loadNotifications } = useNotifications();

  // Koji filter je aktivan: poslednji koji je korisnik primenio (Main.jsx drzi oba, "nije izabran"
  // je datum 2000-01-01 odnosno naziv "default")
  const imaDatum = primljenDatum.getTime() !== NEMA_DATUMA;
  const imaNaziv = primljenNaziv !== "default";
  const [nacin, setNacin] = useState(imaNaziv ? 'naziv' : imaDatum ? 'datum' : 'sve');
  useEffect(() => { if (imaDatum) setNacin('datum'); }, [primljenDatum]);
  useEffect(() => { if (imaNaziv) setNacin('naziv'); }, [primljenNaziv]);

  const putanja =
    nacin === 'naziv' && imaNaziv ? `/api/events/search?title=${encodeURIComponent(primljenNaziv)}`
    : nacin === 'datum' && imaDatum ? `/api/events/by-date?date=${format(primljenDatum, 'yyyy-MM-dd')}`
    : '/api/events';

  // Dogadjaji se ucitavaju 3 po 3 kako korisnik skroluje (vidi useInfiniteList)
  const lista = useInfiniteList(putanja, { mapItem: withFormattedDate });

  const [korisnik, setKorisnik] = useState(null);
  const [korisnik_Id, setKorisnikId] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true); // indikator ucitavanja

  // Novokreiran dogadjaj (iz EventForm -> HomePage -> Main -> ovde) se
  // zalepi na vrh liste bez novog fetch-a. `_isNovi` flag samo javlja kartici
  // da odigra kratku "evo tvog posta" animaciju - ne ide na backend.
  useEffect(() => {
    if (!noviDogadjaj) return;
    lista.setItems(prev => [{ ...withFormattedDate(noviDogadjaj), _isNovi: true }, ...prev]);
  }, [noviDogadjaj]);


  // BRISANJE OBJAVE - u feedu samo uklonimo iz liste
  const handleDeleteEvent = async (id) => {
    try {
      await api.del(`/api/events/${id}`);
      lista.setItems(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
      loadNotifications(); // backend je obrisao i notifikacije tog dogadjaja
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
  };

  // Postavljamo korisnik_Id cim imamo ulogovanog korisnika
  useEffect(() => {
    if (userId) {
      setKorisnikId(userId);
    } else {
      setUcitavaSe(false); // Nema ulogovanog korisnika, prekidamo ucitavanje
    }
  }, [userId]);

  // Kada imamo korisnik_Id, ucitavamo korisnika
  useEffect(() => {
    if (!korisnik_Id) return;

    const loadUser = async () => {
      try {
        setUcitavaSe(true);
        const data = await api.get(`/api/users/${korisnik_Id}`);
        data.datumrodjenja = formatDate(data.datum_rodjenja);
        setKorisnik(data);
      } catch (error) {
        console.error(error);
      } finally {
        setUcitavaSe(false);
      }
    };

    loadUser();
  }, [korisnik_Id]);

  if (ucitavaSe) {
    return <p>Učitavanje...</p>;
  }

  if (!korisnik) {
    return <p>Niste prijavljeni.</p>;
  }

  const openEvent = (dogadjaj) => {
    navigate(`/objava/${dogadjaj.id}`);
  };

  return (
    <div>
      {lista.items.map((dogadjaj) => (
        <EventCard
          key={dogadjaj.id}
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onOpen={openEvent}
          onDelete={handleDeleteEvent}
        />
      ))}
      {!lista.initialLoading && !lista.error && lista.items.length === 0 && (
        <div className="lista-prazno">Nema dogadjaja za prikaz.</div>
      )}
      <InfiniteScrollFooter lista={lista} />
    </div>
  );
}

export default EventFeed
