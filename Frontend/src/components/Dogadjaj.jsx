import { api } from '../api';
import React from 'react'
import { useState, useEffect } from 'react';
import DogadjajKartica from './DogadjajKartica';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import moment from 'moment';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import { useNavigate } from 'react-router-dom';


// Main.jsx koristi ovaj datum kao "datum nije izabran"
const NEMA_DATUMA = new Date("2000-01-01").getTime();

const dodajFormatiranDatum = (d) => ({
  ...d,
  formattedDatum: moment(d.datum_Objave).format("DD.MM.YYYY"),
});

function Dogadjaj({ primljenDatum, primljenNaziv, noviDogadjaj }) {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { ucitajNotifikacije } = useNotifications();

  // Koji filter je aktivan: poslednji koji je korisnik primenio (Main.jsx drzi oba, "nije izabran"
  // je datum 2000-01-01 odnosno naziv "default")
  const imaDatum = primljenDatum.getTime() !== NEMA_DATUMA;
  const imaNaziv = primljenNaziv !== "default";
  const [nacin, setNacin] = useState(imaNaziv ? 'naziv' : imaDatum ? 'datum' : 'sve');
  useEffect(() => { if (imaDatum) setNacin('datum'); }, [primljenDatum]);
  useEffect(() => { if (imaNaziv) setNacin('naziv'); }, [primljenNaziv]);

  const putanja =
    nacin === 'naziv' && imaNaziv ? `/Dogadjaj/VratiDogadjajePoNazivu?naziv=${encodeURIComponent(primljenNaziv)}`
    : nacin === 'datum' && imaDatum ? `/Dogadjaj/VratiDogadjajePoDatumu?datum=${format(primljenDatum, 'yyyy-MM-dd')}`
    : '/Dogadjaj/VratiDogadjajeZaHomePage';

  // Dogadjaji se ucitavaju 3 po 3 kako korisnik skroluje (vidi useBeskonacnaLista)
  const lista = useBeskonacnaLista(putanja, { mapiraj: dodajFormatiranDatum });

  const [korisnik, setKorisnik] = useState(null);
  const [korisnik_Id, setKorisnikId] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true); // indikator ucitavanja

  // Novokreiran dogadjaj (iz NapraviDogadjaj -> HomePage -> Main -> ovde) se
  // zalepi na vrh liste bez novog fetch-a. `_isNovi` flag samo javlja kartici
  // da odigra kratku "evo tvog posta" animaciju - ne ide na backend.
  useEffect(() => {
    if (!noviDogadjaj) return;
    lista.setStavke(prev => [{ ...dodajFormatiranDatum(noviDogadjaj), _isNovi: true }, ...prev]);
  }, [noviDogadjaj]);


  // BRISANJE OBJAVE - u feedu samo uklonimo iz liste
  const obrisiObjavu = async (id) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${id}`);
      lista.setStavke(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
      ucitajNotifikacije(); // backend je obrisao i notifikacije tog dogadjaja
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
  };

  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
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

    const ucitajKorisnika = async () => {
      try {
        setUcitavaSe(true);
        const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
        data.datumrodjenja = formatirajDatum(data.datum_rodjenja);
        setKorisnik(data);
      } catch (error) {
        console.error(error);
      } finally {
        setUcitavaSe(false);
      }
    };

    ucitajKorisnika();
  }, [korisnik_Id]);

  if (ucitavaSe) {
    return <p>Učitavanje...</p>;
  }

  if (!korisnik) {
    return <p>Niste prijavljeni.</p>;
  }

  const handleClickObjava = (dogadjaj) => {
    navigate(`/objava/${dogadjaj.id}`);
  };

  return (
    <div>
      {lista.stavke.map((dogadjaj) => (
        <DogadjajKartica
          key={dogadjaj.id}
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onOpen={handleClickObjava}
          onObrisi={obrisiObjavu}
        />
      ))}
      {!lista.pocetno && !lista.greska && lista.stavke.length === 0 && (
        <div className="lista-prazno">Nema dogadjaja za prikaz.</div>
      )}
      <KrajListe lista={lista} />
    </div>
  );
}

export default Dogadjaj
