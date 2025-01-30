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

//pretvoren jQuery kod u React
  //#region 
  
  useEffect(() => {
    const handleClick = (selector, className) => {
      document.querySelectorAll(selector).forEach(element => {
        element.addEventListener('click', (event) => {
          event.preventDefault();
          //document.querySelector(className).classList.toggle('active');
          document.querySelector('.wrapper').classList.toggle('overlay');
        });
      });
    };

    handleClick('.zzatvaranje > ul > li > a', '.post-popup.pst-pj');
    handleClick('.zzatvaranje > ul > li > a', '.post-popup.job_post');
    handleClick('.post_project', '.post-popup.pst-pj');
    handleClick('.post-jb', '.post-popup.job_post');
    handleClick('.overview-open', '#overview-box');
    handleClick('.exp-bx-open', '#experience-box');
    handleClick('.ed-box-open', '#education-box');
    handleClick('.lct-box-open', '#location-box');
    handleClick('.skills-open', '#skills-box');
    handleClick('.esp-bx-open', '#establish-box');
    handleClick('.gallery_pt > a', '#create-portfolio');
    handleClick('.emp-open', '#total-employes');
    handleClick('.ask-question', '#question-box');
    handleClick('.chat-mg', '.conversation-box');
    handleClick('.ed-opts-open', '.ed-options');
    handleClick('.not-box-open', '.notification-box');
    handleClick('.user-info', '.user-account-settingss');
    handleClick('.forum-links-btn > a', '.forum-links');

    document.querySelectorAll('.close-box').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        element.closest('.open').classList.remove('open');
        document.querySelector('.wrapper').classList.remove('overlay');
      });
    });

    document.querySelectorAll('.sign-control li').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const tabId = element.getAttribute('data-tab');
        document.querySelectorAll('.sign-control li').forEach(el => el.classList.remove('current'));
        document.querySelectorAll('.sign_in_sec').forEach(el => el.classList.remove('current'));
        element.classList.add('current', 'animated', 'fadeIn');
        document.getElementById(tabId).classList.add('current', 'animated', 'fadeIn');
      });
    });

    document.querySelectorAll('.signup-tab ul li').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const tabId = element.getAttribute('data-tab');
        document.querySelectorAll('.signup-tab ul li').forEach(el => el.classList.remove('current'));
        document.querySelectorAll('.dff-tab').forEach(el => el.classList.remove('current'));
        element.classList.add('current', 'animated', 'fadeIn');
        document.getElementById(tabId).classList.add('current', 'animated', 'fadeIn');
      });
    });

    document.querySelectorAll('.tab-feed ul li').forEach(element => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        const tabId = element.getAttribute('data-tab');
        document.querySelectorAll('.tab-feed ul li').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.product-feed-tab').forEach(el => el.classList.remove('current'));
        element.classList.add('active', 'animated', 'fadeIn');
        document.getElementById(tabId).classList.add('current', 'animated', 'fadeIn');
      });
    });

    const gap = document.querySelector('.container').offsetLeft;
    document.querySelectorAll('.cover-sec > a, .chatbox-list').forEach(element => {
      element.style.right = `${gap}px`;
    });

    return () => {
      // Cleanup event listeners
      document.querySelectorAll('.zzatvaranje > ul > li > a, .post_project, .post-jb, .overview-open, .exp-bx-open, .ed-box-open, .lct-box-open, .skills-open, .esp-bx-open, .gallery_pt > a, .emp-open, .ask-question, .chat-mg, .ed-opts-open, .not-box-open, .user-info, .forum-links-btn > a, .close-box, .sign-control li, .signup-tab ul li, .tab-feed ul li').forEach(element => {
        element.replaceWith(element.cloneNode(true));
      });
    };
  }, []);

//#endregion
 

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
  const [mojdatum, setmojdatum] = useState();

  const [isMyDogadjaj, setIsMyDogadjaj] = useState(true);

  
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


  const fetchDogadjaji = () => {
    console.log(brojPosiljke);
    console.log(ukupnoElemenata);
    const url = `http://localhost:5153/Dogadjaj/VratiDogadjajeZaHomePage/${brojPosiljke}/${ukupnoElemenata}`;
    fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
      .then(res => {
        if (res.status === 401){
          navigate('/')
        }
        else{
          return res.json();
        }
        
      })
      .catch(error =>{
        console.log("");
      })
      .then(data => {
        console.log(data);
        if (data.kraj === undefined) {
          if (brojPosiljke === 1)
          setDogadjaji(data.dogadjaji.map(dogadjaj => ({ ...dogadjaj, formattedDatum: moment(dogadjaj.datum_Objave).format("DD.MM.YYYY") })));
          else
          setDogadjaji(prevDogadjaji => [...prevDogadjaji, ...data.dogadjaji.map(dogadjaj => ({ ...dogadjaj, formattedDatum: moment(dogadjaj.datum_Objave).format("DD.MM.YYYY") }))]);


          setUkupnoElemenata(data.ukupno_elemenata);
          // sada dodato za potrebe Reakcije.js
          const dogadjajIds = data.dogadjaji.map(dogadjaj => dogadjaj.id);
          setIDucitanidogadjaji(prevIds => [...prevIds, ...dogadjajIds]);
        }
      }
      ).catch(error =>{
        console.log("");
      })
    setTrenutno(0);
    //console.log("Izlazim iz ClassicFetch");
  };




  const fetchDogPoDatum = (prosledjenDatum) => {
    //console.log("Usao sam u DatumFetch");
    if (primljenDatum.getTime() !== (new Date("2000-01-01")).getTime()) {
      const formattedDate = format(prosledjenDatum, 'yyyy-MM-dd');
      const url = `http://localhost:5153/Dogadjaj/VratiDogadjajePoDatumu/${formattedDate}/${brojPosiljkeDatum}/${ukupnoElemenataDatum}`;
      fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
        .then(res => res.json())
        .then(data => {
          if (data.kraj === undefined) {
          if (brojPosiljkeDatum === 1)
          setDogadjaji(data.dogadjaji.map(dogadjaj => ({ ...dogadjaj, formattedDatum: moment(dogadjaj.datum_Objave).format("DD.MM.YYYY") })));
          else
          setDogadjaji(prevDogadjaji => [...prevDogadjaji, ...data.dogadjaji.map(dogadjaj => ({ ...dogadjaj, formattedDatum: moment(dogadjaj.datum_Objave).format("DD.MM.YYYY") }))]);

          setUkupnoElemenataDatum(data.ukupno_elemenata);

          const dogadjajIds = data.dogadjaji.map(dogadjaj => dogadjaj.id);
          setIDucitanidogadjaji(prevIds => [...prevIds, ...dogadjajIds]);
          }
        });
      setTrenutno(1);

    }
    //console.log("Izlazim iz DatumFetch");
  }

  const fetchDogPoNaziv = async (prosledjenNaziv) =>
    {
      //console.log("SACE UDJE U FETCH DOG PO NAZIV");
      //console.log(primljenNaziv); // OVDE DEFAULT?
      //console.log(prosledjenNaziv);
      if(primljenNaziv !== "default")
      { 
        console.log("USO!!!!!");
        console.log("Usao sam u NazivFetch:" +"Posiljka: " +brojPosiljkeNaziv +"  ukupno: "+ ukupnoElemenataNaziv);
        const url = `http://localhost:5153/Dogadjaj/VratiDogadjajePoNazivu/${prosledjenNaziv}/${brojPosiljkeNaziv}/${ukupnoElemenataNaziv}`;
        await fetch(url, {
          method: 'GET',
          credentials: 'include',
        })
        .then(res => res.json())
        .then(data => {
          console.log("SACE DATA:");
          console.log(data);
          if(data.kraj === undefined)
          {
            if (brojPosiljkeNaziv === 1)
              setDogadjaji(data.dogadjaji);
            else 
              setDogadjaji(prevDogadjaji => [...prevDogadjaji, ...data.dogadjaji]);

            setUkupnoElemenataNaziv(data.ukupno_elemenata);
          }
        });
        setTrenutno(2);
        console.log("Izlazim iz NazivFetch");
      }
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
  const obrisiObjavu = (id,index) => {
    const url = `http://localhost:5153/Dogadjaj/IzbrisiDogadjaj/${id}`;
    fetch(url, {
      method: 'DELETE',
    })
      .then(response => {
        if (response.ok) {
          // sad se azurira stanje dogadjaja tako da se ukloni izbrisn dogadjaj
          setDogadjaji(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
        }
      })
      .catch(error => {
        console.log('Doslo je do greske prilikom brisanja objave:', error);
      });
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

    const apiUrl = `http://localhost:5153/Pr_dog/PrijaviDogadjaj/${id}`;
    let razlogUrl = `http://localhost:5153/Razlog/KreirajRazlog/${id}/${selectedOption}/${opis}`;
    if (selectedOption === "ostalo" && opis === "") {
      razlogUrl += "bezOpisa";
    }

    if (selectedOption !== "ostalo") {
      razlogUrl += "nema"; // da stavi nema na opis ako je bilo sta drugo selektovano osim OSTALO
    }
    

    try {
      const response1 = await fetch(apiUrl, {
        method: 'POST',
        credentials: 'include',
      });
      console.log(response1);

      if(response1.ok){
        console.log("sve okej brt")
      }
      if (!response1.ok) {
        console.log('Greska prilikom slanja prijave objave.');
      }
      if(response1.status === 401)
      {
        navigate('/')
      }

      
        const response2 = await fetch(razlogUrl, {
          method: 'POST',
        });
        console.log(response2);
        if (!response2.ok) {
          
          console.log('Greška prilikom slanja razloga prijave.');
        }
      

      // Resetuj polja nakon uspešnog slanja
      setSelectedOption('');
      setOpis('');
      //alert('Objava je uspesno prijavljena.');

    } catch (error) {
      console.error(error);
      //alert('Doslo je do greske prilikom prijave objave.');
    }
  };

  
  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };

  let korisnik_Id;
  useEffect(() => {
    korisnik_Id = Cookies.get('userID');
  }, []);
  
  const ucitajKorisnika = () => {

    const url = `http://localhost:5153/Korisnik/VratiKorisnika_ID/${korisnik_Id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        //console.log(data.datum_rodjenja);
        const formatiranDatum = formatirajDatum(data.datum_rodjenja);
        data.datumrodjenja = formatiranDatum;
        //console.log(formatiranDatum);
        setKorisnik(data);
        //console.log(data);
        setmojdatum(formatiranDatum);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  
  useEffect(() => {
    ucitajKorisnika();
  }, []);


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
                              src={dogadjaj.slikaKorisnika ? `http://localhost:5153/resources/${dogadjaj.slikaKorisnika}` : "http://via.placeholder.com/50x50"}
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
              <img src={`http://localhost:5153/resources/${dogadjaj.dogadjajImage}`} className="rounded float-left dogadjaj-slika" />
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