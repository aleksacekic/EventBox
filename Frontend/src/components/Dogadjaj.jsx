import { api, API_BASE } from '../api';
import React from 'react'
import { useState, useEffect } from 'react';
import HideShowMapa from './Hide&ShowMapa';
import Komentari from './Komentari';
import Reakcije from './Reakcije'
import moment from 'moment';
import { format } from 'date-fns';
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom';


function Dogadjaj({ primljenDatum, primljenNaziv, onDogadjajIdChange}) {
   //ovo trece sluzi za prosledjivanje dogadjajId iz Komentari.js u Dogajdaj.js pa u Main.js
  // console.log(filtriraniDogadjaji);
  const google = window.google;
  const navigate = useNavigate();

  // [Faza 1] Uklonjen mrtav "pretvoren jQuery kod" blok (imperativni DOM port teme):
  // vezivao je listenere na selektore van ove komponente, a cleanup je radio
  // element.replaceWith(cloneNode) sto lomi Reactovu rekonsilijaciju.
 

  //#region JAVASCRIPT
  // ZA OTVORI KOMENTAR OBJAVE
 
  const prikaziPopupFormu = (event, id) => {
    event.preventDefault();
    const overlay = document.getElementById("popup-overlay" + id);
    const form = document.getElementById("popup-form" + id);

    overlay.style.display = "block";
    form.style.display = "block";
  };

  const sakrijPopupFormu = (id) => {
    sakrijTekstOstalo();
    const overlay = document.getElementById("popup-overlay" + id);
    const form = document.getElementById("popup-form" + id);

    overlay.style.display = "none";
    form.style.display = "none";
  };

  const otkaziPrijavu = (id) => {
    sakrijPopupFormu(id);
  };

  const submitForm = (id) => {
    // Logika za obradu forme
    console.log("Odabrana opcija:", selectedOption);
    console.log("Unesen tekst (Ostalo):", tekstOstalo);

    setSelectedOption('');
    setTekstOstalo('');

    if (selectedOption === 'ostalo') {
      setShowFormOstalo(true);
    } else {
      setShowFormOstalo(false);
    }

    sakrijPopupFormu(id);
  };

  const prikaziPopup = (id) => {
    const popup = document.getElementById("popup");
    const overlay1 = document.getElementById("overlay1");

    popup.style.display = "block";
    overlay1.style.display = "block";
  };

  const zatvoriPopup = () => {
    const popup = document.getElementById("popup");
    const overlay1 = document.getElementById("overlay1");

    popup.style.display = "none";
    overlay1.style.display = "none";
  };

  const submitIprikazipopup = (id) => {
    submitForm(id);
    prikaziPopup(id);
  };


  //#endregion

  const [dogadjaji, setDogadjaji] = useState([]);
  const [brojPosiljke, setBrojPosiljke] = useState(1);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);

  const [brojPosiljkeDatum, setBrojPosiljkeDatum] = useState(1);
  const [ukupnoElemenataDatum, setUkupnoElemenataDatum] = useState(0);

  const [brojPosiljkeNaziv, setBrojPosiljkeNaziv] = useState(1);
  const [ukupnoElemenataNaziv, setUkupnoElemenataNaziv] = useState(0);
  const [trenutno, setTrenutno] = useState(0); //0 - HomePage  1 - Datum   2 - Naziv

  const [prikazaniDogadjaj, setPrikazaniDogadjaj] = useState(null);
  const [prikaziKomentare, setPrikaziKomentare] = useState(false);

  const [activeIndex, setActiveIndex] = useState(null);

  const [selectedOption, setSelectedOption] = useState('Nepozeljan dogadjaj');
  const [opis, setOpis] = useState('');
  const [tekstOstalo, setTekstOstalo] = useState('');
  const [showFormOstalo, setShowFormOstalo] = useState(false);

  const [IDucitanidogadjaji, setIDucitanidogadjaji] = useState([]); // ZA POTREBE PROSLEDJIVANJA ID-JEVA DOGADJAJA u Reakcije.js


  const [korisnik, setKorisnik] = useState(null);
  const [korisnik_Id, setKorisnikId] = useState(null);
  const [ucitavaSe, setUcitavaSe] = useState(true); // indikator ucitavanja



  
  /*function proveriDogadjajZaBrisanje(event, dogadjajId) {
    event.preventDefault();
    if (prikazaniDogadjaj === dogadjajId) {
      setIsMyDogadjaj(true);
    } else {
      setIsMyDogadjaj(false);
    }
  }*/
 //console.log(IDucitanidogadjaji);
 

  function prikaziTekstOstalo() {
    setShowFormOstalo(true);
  }
  function sakrijTekstOstalo() {
    setShowFormOstalo(false);
  }

  const UcitajDalje = () => {
    if(trenutno === 0)
      setBrojPosiljke(prevBrojPosiljke => prevBrojPosiljke + 1);
    else if(trenutno === 1)
      setBrojPosiljkeDatum(prevBrojPosiljkeDatum => prevBrojPosiljkeDatum + 1);
    else if(trenutno === 2)
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
    //console.log("Pozvan je refresh");
  };

 
  useEffect(() => {
    const fetchClassic = async () => {
      fetchDogadjaji();
    }
    fetchClassic();
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

  const fetchDogPoNaziv = async (prosledjenNaziv) =>
    {
      //console.log("SACE UDJE U FETCH DOG PO NAZIV");
      //console.log(primljenNaziv); // OVDE DEFAULT?
      //console.log(prosledjenNaziv);
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

  // ZA KOMENTARE
  function otvoriDiv(event, dogadjajId) {
    event.preventDefault();
    if (prikazaniDogadjaj === dogadjajId) {
      setPrikaziKomentare(!prikaziKomentare);
    } else {
      setPrikaziKomentare(true);
      setPrikazaniDogadjaj(dogadjajId);
    }
  }

  // BRISANJE OBJAVE
  const obrisiObjavu = async (id, index) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${id}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
    setActiveIndex(null);
  };

  const toggleOptions = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Zatvori opciju ako je već otvorena
    } else {
      setActiveIndex(index); // Otvori opciju
    }
  };

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };
  useEffect(() => { // ZA SLUCAJ DA NISTA NIJE SLEKTOVANO (da ne pukne)
    if (!selectedOption) {
      setSelectedOption('nepozeljan'); // Postavite podrazumevanu vrednost ako nijedno dugme nije označeno
    }
  }, [selectedOption]);

  const handleOpisChange = (event) => {
    setOpis(event.target.value);
  };

  const prijava = async (id,event) => {
    event.preventDefault();

    if (!selectedOption) {
      alert('Molimo odaberite razlog prijave.');
      return;
    }

    let razlogPath = `/Razlog/KreirajRazlog/${id}/${selectedOption}/${opis}`;
    if (selectedOption === "ostalo" && opis === "") {
      razlogPath += "bezOpisa";
    }
    if (selectedOption !== "ostalo") {
      razlogPath += "nema"; // "nema" na opis ako je selektovano bilo sta osim OSTALO
    }

    try {
      // 401 -> api klijent sam vraca na /login
      await api.post(`/Pr_dog/PrijaviDogadjaj/${id}`, undefined, { credentials: 'include' });
      await api.post(razlogPath);

      // Resetuj polja nakon uspešnog slanja
      setSelectedOption('');
      setOpis('');
    } catch (error) {
      console.error(error);
    }
  };

  
  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };

  

  // Postavljamo korisnik_Id iz cookies-a odmah po učitavanju komponente
  useEffect(() => {
    const id = Cookies.get('userID');
    if (id) {
      setKorisnikId(id);
    } else {
      setUcitavaSe(false); // Ako nema userID u cookies-u, prekidamo učitavanje
    }
  }, []);
  
  // Kada imamo korisnik_Id, učitavamo korisnika
  useEffect(() => {
    if (!korisnik_Id) return;
  
    const ucitajKorisnika = async () => {
      try {
        setUcitavaSe(true); // Počinjemo učitavanje
        const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
        data.datumrodjenja = formatirajDatum(data.datum_rodjenja);
        setKorisnik(data);
      } catch (error) {
        console.error(error);
      } finally {
        setUcitavaSe(false); // Završavamo učitavanje
      }
    };
  
    ucitajKorisnika();
  }, [korisnik_Id]);


  // JSX provera da izbegnemo grešku
if (ucitavaSe) {
  return <p>Učitavanje...</p>; // Prikazujemo loader dok se učitava korisnik
}

if (!korisnik) {
  return <p>Niste prijavljeni.</p>; // Ako korisnik nije postavljen, znači da nije ulogovan
}

 //Za prebacivanje na posebnu objavu.
   //const navigate = useNavigate();

   const handleClickObjava = (id, obj) => {
    navigate(`/objava/${id}`, { state: { obj } });
};

   //console.log("Korisnik: ", korisnik);
   
  return (
    <div>
      {dogadjaji.map((dogadjaj,index) => (
        <div className="post-bar" key={dogadjaj.id} onClick={() => handleClickObjava(dogadjaj.id, korisnik)} style={{ cursor: 'pointer' }}>
          <div className="post_topbar">
            <div className="usy-dt">
            {korisnik ? (
                              <img
                              className="profilnaslikaobjava"
                              src={dogadjaj.slikaKorisnika ? `${API_BASE}/resources/${dogadjaj.slikaKorisnika}` : "http://via.placeholder.com/50x50"}
                       />
                            ) : (
                              <p>Korisnik nije dostupan</p>
                            )}
            
              <div className="usy-name">
                <h3>@{dogadjaj.userName_Kreatora}</h3>
                <span><img src="images/clock.png" />{dogadjaj.formattedDatum}</span>
              </div>
            </div>

            {/* moze i (dogadjaj.userName_Kreatora === korisnik.korisnicko_Ime) */}
            {(dogadjaj.iD_Kreatora === korisnik.id) && (
              <div className={`ed-opts ${activeIndex === index ? 'active' : ''}`} onClick={(e) => { e.stopPropagation();}}>
              <a className="ed-opts-open" onClick={(e) => { e.stopPropagation(); toggleOptions(index)}}><i className="la la-ellipsis-v" /></a>
              <ul className={`ed-options ${activeIndex === index ? 'active' : ''}`}>
                <li><a className='opcijeobjava' onClick={(e) => { e.stopPropagation(); obrisiObjavu(dogadjaj.id)}}>Obrisi objavu</a></li>
              </ul>
            </div>
            )
            }
             
          </div>
          <div className="job_descp">
            <h3>{dogadjaj.naslov}</h3>
            <ul className="job-dt">
              <li><a href="#">{dogadjaj.kategorija}</a></li>
              <li><span>{new Date(dogadjaj.datum_Dogadjaja).toLocaleDateString()} od {dogadjaj.vreme_pocetka}</span></li>
            </ul>
            <p>{dogadjaj.opis}</p>
            {/* SLIKA DOGADJAJA */}
            {/* <img src={dogadjaj.dogadjajImage} className="rounded float-left dogadjaj-slika" /> */}
            {dogadjaj.dogadjajImage && (
              <img src={`${API_BASE}/resources/${dogadjaj.dogadjajImage}`} className="rounded float-left dogadjaj-slika" />
            )}
            {/* MAPA POCETAK */}
            <HideShowMapa
              latitude={dogadjaj.x}
              longitude={dogadjaj.y}
            />
            {/* POCETAK REAKCIJE */}
            <Reakcije dogadjaj_Id={dogadjaj.id} IDucitanidogadjaji={IDucitanidogadjaji}/>
            {/* KRAJ REAKCIJE */}
            {/* MAPA KRAJ */}
          </div>
          <div className="job-status-bar">
            <ul className="like-com d-flex">
              <li className="komentardiv" onClick={(e) => { e.stopPropagation(); otvoriDiv(e, dogadjaj.id)}}>
                <img src="images/com.png" className="com-slika" />
                <a href="#" className="com">Komentar</a>
              </li>
              {/* <li className="posaljidiv">
                <img src="images/share1.png" />
                <a href="#" className="share">Posalji prijatelju</a>
              </li> */}
              <li className="prijavidiv" onClick={(e) => { e.stopPropagation(); prikaziPopupFormu(e, dogadjaj.id)}}>
                <img src="images/report17.png" />
                <a href="#" className="report-to-admin">Prijavi objavu</a>
              </li>
              <div id={"popup-overlay"+ dogadjaj.id} className="popup-overlay" onClick={(e) => { e.stopPropagation();}}/>
              <div id={"popup-form"+ dogadjaj.id} className="popup-form" onClick={(e) => { e.stopPropagation();}}>
                {/* HTML kod forme */}
                <div className="form-options">
                  <label>
                    <input type="radio" name="opcija" defaultValue="nepozeljan" onChange={handleOptionChange} defaultChecked/> Nepozeljan sadrzaj
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="nasilje" onChange={handleOptionChange} /> Nasilje
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="terorizam" onChange={handleOptionChange} /> Terorizam
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="govor_mrznje" onChange={handleOptionChange} /> Govor mrznje
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="lazne_informacije" onChange={handleOptionChange} /> Lazne informacije
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="uznemiravanje" onChange={handleOptionChange} /> Uznemiravanje
                  </label>
                  <label>
                    <input type="radio" name="opcija" defaultValue="ostalo" onChange={handleOptionChange}  onClick={prikaziTekstOstalo} /> Ostalo
                  </label>
                </div>
                {selectedOption === 'ostalo' && (
                  <div id="form-ostalo" className="form-ostalo">
                    <label htmlFor="tekst-ostalo">Opisite nam razlog prijave:</label>
                    <textarea id="tekst-ostalo" name="tekst-ostalo" rows={3} value={opis} onChange={handleOpisChange} />
                  </div>
                )}
                <div className="form-buttons">
                  <button className="btn-otkazi" onClick={() => otkaziPrijavu(dogadjaj.id)}> Otkazi</button>
                  <button className="btn-prijavi" onClick={(event) => { prijava(dogadjaj.id, event); submitIprikazipopup(dogadjaj.id); }}>Prijavi</button>
                </div>

              </div>
              <div id="popup" className="popup" onClick={(e) => { e.stopPropagation();}}>
                <span className="close" onClick={zatvoriPopup}>×</span>
                <p>Uspesno ste prijavili objavu koja krsi pravila zajednice. Administrator ce uskoro pregledati vasu prijavu. Hvala!</p>
              </div>
              <div id="overlay1" className="overlay1" onClick={(e) => { e.stopPropagation();}}/>
            </ul>
          </div>
          {/* DEO ZA KOMENTARE ! ! !  */}
          {prikaziKomentare && prikazaniDogadjaj === dogadjaj.id && (
            <div className="comment-section"  onClick={(e) => { e.stopPropagation(); }}>
              <Komentari dogadjajId={dogadjaj.id} prikazaniDogadjaj={prikazaniDogadjaj} korisnikovaSlika={korisnik.korisnikImage} onDogadjajIdSubmit={onDogadjajIdChange}/>
            </div>)}
        </div>))}
      <button className='ucitajjosdogadjaja' onClick={() => UcitajDalje()}>Ucitaj jos dogadjaja...</button>
    </div>
  );

}

export default Dogadjaj