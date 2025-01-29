import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react'
import HideShowMapa from './Hide&ShowMapa';
import Komentari from './Komentari';
import Reakcije from './Reakcije'
import moment from 'moment';
import { format } from 'date-fns';
import Cookies from 'js-cookie'
import { useLocation } from 'react-router-dom';


function DogadjajPosebnaStrana() {
    const [dogadjaj, setDogadjaj] = useState({});
    useEffect(() => {
        async function fetchDogadjaj(id) {
            try {
                const response = await fetch(`http://localhost:5153/Dogadjaj/VratiDogadjaj/${id}`);
                if (!response.ok) {
                    throw new Error(`Greška pri dohvaćanju događaja: ${response.statusText}`);
                }
                const data = await response.json();
                setDogadjaj(data);
            } catch (error) {
                console.error('Greška pri dohvaćanju podataka o događaju:', error);
            }
        }

        fetchDogadjaj(id); 
    }, []);

    //const [korisnik, setKorisnik] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);
    const [prikazaniDogadjaj, setPrikazaniDogadjaj] = useState(null);
    const [prikaziKomentare, setPrikaziKomentare] = useState(false);
    const [selectedOption, setSelectedOption] = useState('Nepozeljan dogadjaj');
    const [tekstOstalo, setTekstOstalo] = useState('');
    const [showFormOstalo, setShowFormOstalo] = useState(false);
    const [opis, setOpis] = useState('');
     const [mojdatum, setmojdatum] = useState();
    //
    const [index, setIndex] = useState('');
    //
    const { id } = useParams(); // dobija `id` iz URL-a

    const navigate = useNavigate();
    const handleBackClick = () => {
        navigate(-1); // -1 vraća na prethodnu stranicu
    };

    const location = useLocation();
    const obj = location.state?.obj;

    useEffect(() => {
        async function fetchDogadjaj(id) {
            try {
                const response = await fetch(`http://localhost:5153/Dogadjaj/VratiDogadjaj/${id}`);
                if (!response.ok) {
                    throw new Error(`Greška pri dohvaćanju događaja: ${response.statusText}`);
                }
                const data = await response.json();
                setDogadjaj(data);
            } catch (error) {
                console.error('Greška pri dohvaćanju podataka o događaju:', error);
            }
        }

        fetchDogadjaj(id); 
    }, []);

        const formatirajDatum = (datum) => {
          return moment(datum).format('DD.MM.YYYY');
        };

   /* useEffect(() => {
      const ucitajKorisnika = () => {
          const korisnik_Id = Cookies.get('userID');
          const url = `http://localhost:5153/Korisnik/VratiKorisnika_ID/${korisnik_Id}`;

          fetch(url)
              .then((res) => res.json())
              .then((data) => {
                  const formatiranDatum = formatirajDatum(data.datum_rodjenja);
                  data.datumrodjenja = formatiranDatum;
                  //console.log(formatiranDatum);
                  setKorisnik(data);
                  setmojdatum(formatiranDatum);
              })
              .catch((error) => {
                  console.log(error);
              });
      };

      ucitajKorisnika(); 
  }, []); */

       

        

        const obrisiObjavu = (id,index) => {
          const url = `http://localhost:5153/Dogadjaj/IzbrisiDogadjaj/${id}`;
          fetch(url, {
            method: 'DELETE',
          })
            .then(response => {
              if (response.ok) {
                // sad se azurira stanje dogadjaja tako da se ukloni izbrisn dogadjaj
                //setDogadjaji(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
                //-------------------OVDE MORA DOPUNA!!!-----------------------------------------------
                //
                //
                //
                //
                //
                //-------------------OVDE MORA DOPUNA!!!-----------------------------------------------
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

        const handleOpisChange = (event) => {
          setOpis(event.target.value);
        };

        const submitIprikazipopup = (id) => {
          submitForm(id);
          prikaziPopup(id);
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
         
        function otvoriDiv(event, dogadjajId) {
          event.preventDefault();
          if (prikazaniDogadjaj === dogadjajId) {
            setPrikaziKomentare(!prikaziKomentare);
          } else {
            setPrikaziKomentare(true);
            setPrikazaniDogadjaj(dogadjajId);
          }
        }

        const prikaziPopupFormu = (event, id) => {
          event.preventDefault();
          const overlay = document.getElementById("popup-overlay" + id);
          const form = document.getElementById("popup-form" + id);
      
          overlay.style.display = "block";
          form.style.display = "block";
        };

        const handleOptionChange = (event) => {
            setSelectedOption(event.target.value);
          };
          useEffect(() => { // ZA SLUCAJ DA NISTA NIJE SLEKTOVANO (da ne pukne)
            if (!selectedOption) {
              setSelectedOption('nepozeljan'); // Postavite podrazumevanu vrednost ako nijedno dugme nije označeno
            }
          }, [selectedOption]);

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

          function prikaziTekstOstalo() {
            setShowFormOstalo(true);
          }
          function sakrijTekstOstalo() {
            setShowFormOstalo(false);
          }
        
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

    return (
        <div>
           <div className="col-lg-6 col-md-8 no-pd">
           <div className="main-ws-sec">
            <button onClick={handleBackClick} className="back-btn">
              <i className="la la-arrow-left ikonicaback"></i>
            </button>
            <div className="post-barALTERNATIVE" key={dogadjaj.id}>
          <div className="post_topbar">
            <div className="usy-dt">
            {obj ? (
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
            {(dogadjaj.iD_Kreatora === obj.id) && (
              <div className={`ed-opts ${activeIndex === index ? 'active' : ''}`}>
              <a className="ed-opts-open" onClick={() => toggleOptions(index)}><i className="la la-ellipsis-v" /></a>
              <ul className={`ed-options ${activeIndex === index ? 'active' : ''}`}>
                <li><a className='opcijeobjava' onClick={() => obrisiObjavu(dogadjaj.id)}>Obrisi objavu</a></li>
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
            <div>
                                    <div className="divreakcije divreakcije1">
                                      <button className='btnzaintprofil'
                                      >
                                        Zainteresovanih: {dogadjaj.broj_Zainteresovanih}
                                      </button>
                                      <button className='btnmozdaprofil'
                                      >
                                        Mozda: {dogadjaj.broj_Mozda}
                                      </button>
                                      <button className='btnnezaintprofil'
                                      >
                                        Nezainteresovanih: {dogadjaj.broj_Nezainteresovanih}
                                      </button>
                                    </div>
                                  </div>
            {/* KRAJ REAKCIJE */}
            {/* MAPA KRAJ */}
          </div>
          <div className="job-status-bar">
            <ul className="like-com d-flex">
              <li className="komentardiv" onClick={(event) => otvoriDiv(event, dogadjaj.id)}>
                <img src="images/com.png" className="com-slika" />
                <a href="#" className="com">Komentar</a>
              </li>
              {/* <li className="posaljidiv">
                <img src="images/share1.png" />
                <a href="#" className="share">Posalji prijatelju</a>
              </li> */}
              <li className="prijavidiv" onClick={(event) => prikaziPopupFormu(event, dogadjaj.id)}>
                <img src="images/report17.png" />
                <a href="#" className="report-to-admin">Prijavi objavu</a>
              </li>
              <div id={"popup-overlay"+ dogadjaj.id} className="popup-overlay" />
              <div id={"popup-form"+ dogadjaj.id} className="popup-form">
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
              <div id="popup" className="popup">
                <span className="close" onClick={zatvoriPopup}>×</span>
                <p>Uspesno ste prijavili objavu koja krsi pravila zajednice. Administrator ce uskoro pregledati vasu prijavu. Hvala!</p>
              </div>
              <div id="overlay1" className="overlay1" />
            </ul>
          </div>
          {/* DEO ZA KOMENTARE ! ! !  */}
          {prikaziKomentare && prikazaniDogadjaj === dogadjaj.id && (
            <div className="comment-section">
              <Komentari dogadjajId={dogadjaj.id} prikazaniDogadjaj={prikazaniDogadjaj} korisnikovaSlika={obj.korisnikImage}/>
            </div>)}
            </div>
        </div>
        </div>
        </div>
    );
}

export default DogadjajPosebnaStrana;
