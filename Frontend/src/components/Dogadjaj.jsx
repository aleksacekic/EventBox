import { api } from '../api';
import React from 'react'
import { useState, useEffect } from 'react';
import DogadjajKartica from './DogadjajKartica';
import moment from 'moment';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { useNavigate } from 'react-router-dom';


function Dogadjaj({ primljenDatum, primljenNaziv }) {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [dogadjaji, setDogadjaji] = useState([]);
  const [brojPosiljke, setBrojPosiljke] = useState(1);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);

  const [brojPosiljkeDatum, setBrojPosiljkeDatum] = useState(1);
  const [ukupnoElemenataDatum, setUkupnoElemenataDatum] = useState(0);

  const [brojPosiljkeNaziv, setBrojPosiljkeNaziv] = useState(1);
  const [ukupnoElemenataNaziv, setUkupnoElemenataNaziv] = useState(0);
  const [trenutno, setTrenutno] = useState(0); //0 - HomePage  1 - Datum   2 - Naziv

  const [IDucitanidogadjaji, setIDucitanidogadjaji] = useState([]); // ZA POTREBE PROSLEDJIVANJA ID-JEVA DOGADJAJA u Reakcije.js

  const [korisnik, setKorisnik] = useState(null);
  const [korisnik_Id, setKorisnikId] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true); // indikator ucitavanja

  const UcitajDalje = () => {
    if (trenutno === 0)
      setBrojPosiljke(prevBrojPosiljke => prevBrojPosiljke + 1);
    else if (trenutno === 1)
      setBrojPosiljkeDatum(prevBrojPosiljkeDatum => prevBrojPosiljkeDatum + 1);
    else if (trenutno === 2)
      setBrojPosiljkeNaziv(prevBrojPosiljkeNaziv => prevBrojPosiljkeNaziv + 1);
  }

  const refresujSve = async () => {
    await Promise.all([
      setBrojPosiljkeDatum(1),
      setUkupnoElemenataDatum(0),
      setBrojPosiljkeNaziv(1),
      setUkupnoElemenataNaziv(0),
      setDogadjaji([]),
    ]);
  };


  useEffect(() => {
    fetchDogadjaji();
  }, [brojPosiljke]);


  useEffect(() => {
    const fetchDatum = async () => {
      await refresujSve();
      fetchDogPoDatum(primljenDatum);
    };

    fetchDatum();
  }, [primljenDatum]);


  useEffect(() => {
    const fetchNaziv = async () => {
      await refresujSve();
      fetchDogPoNaziv(primljenNaziv);
    };

    fetchNaziv();
  }, [primljenNaziv]);

  useEffect(() => {
    fetchDogPoDatum(primljenDatum);
  }, [brojPosiljkeDatum])

  useEffect(() => {
    fetchDogPoNaziv(primljenNaziv);
  }, [brojPosiljkeNaziv])


  const fetchDogadjaji = async () => {
    try {
      // 401 -> api klijent sam vraca na /login
      const data = await api.get(
        `/Dogadjaj/VratiDogadjajeZaHomePage/${brojPosiljke}/${ukupnoElemenata}`,
        { credentials: 'include' }
      );
      if (data.kraj === undefined) {
        const mapirani = data.dogadjaji.map(d => ({
          ...d,
          formattedDatum: moment(d.datum_Objave).format("DD.MM.YYYY"),
        }));
        setDogadjaji(prev => (brojPosiljke === 1 ? mapirani : [...prev, ...mapirani]));
        setUkupnoElemenata(data.ukupno_elemenata);
        setIDucitanidogadjaji(prevIds => [...prevIds, ...data.dogadjaji.map(d => d.id)]);
      }
    } catch (error) {
      console.log("fetchDogadjaji:", error);
    }
    setTrenutno(0);
  };

  const fetchDogPoDatum = async (prosledjenDatum) => {
    if (primljenDatum.getTime() === (new Date("2000-01-01")).getTime()) return;
    try {
      const formattedDate = format(prosledjenDatum, 'yyyy-MM-dd');
      const data = await api.get(
        `/Dogadjaj/VratiDogadjajePoDatumu/${formattedDate}/${brojPosiljkeDatum}/${ukupnoElemenataDatum}`,
        { credentials: 'include' }
      );
      if (data.kraj === undefined) {
        const mapirani = data.dogadjaji.map(d => ({
          ...d,
          formattedDatum: moment(d.datum_Objave).format("DD.MM.YYYY"),
        }));
        setDogadjaji(prev => (brojPosiljkeDatum === 1 ? mapirani : [...prev, ...mapirani]));
        setUkupnoElemenataDatum(data.ukupno_elemenata);
        setIDucitanidogadjaji(prevIds => [...prevIds, ...data.dogadjaji.map(d => d.id)]);
      }
    } catch (error) {
      console.log("fetchDogPoDatum:", error);
    }
    setTrenutno(1);
  }

  const fetchDogPoNaziv = async (prosledjenNaziv) => {
    if (primljenNaziv === "default") return;
    try {
      const data = await api.get(
        `/Dogadjaj/VratiDogadjajePoNazivu/${prosledjenNaziv}/${brojPosiljkeNaziv}/${ukupnoElemenataNaziv}`,
        { credentials: 'include' }
      );
      if (data.kraj === undefined) {
        setDogadjaji(prev => (brojPosiljkeNaziv === 1 ? data.dogadjaji : [...prev, ...data.dogadjaji]));
        setUkupnoElemenataNaziv(data.ukupno_elemenata);
      }
    } catch (error) {
      console.log("fetchDogPoNaziv:", error);
    }
    setTrenutno(2);
  }

  // BRISANJE OBJAVE - u feedu samo uklonimo iz liste
  const obrisiObjavu = async (id) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${id}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
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
      {dogadjaji.map((dogadjaj) => (
        <DogadjajKartica
          key={dogadjaj.id}
          dogadjaj={dogadjaj}
          korisnik={korisnik}
          onOpen={handleClickObjava}
          onObrisi={obrisiObjavu}
          idsZaReakcije={IDucitanidogadjaji}
        />
      ))}
      <button className='ucitajjosdogadjaja' onClick={() => UcitajDalje()}>Ucitaj jos dogadjaja...</button>
    </div>
  );
}

export default Dogadjaj
