import { api, API_BASE } from '../api';
import React from 'react'
import Dogadjaj from './Dogadjaj'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState } from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import { Link } from 'react-router-dom';
import moment from 'moment';
import Cookies from 'js-cookie'
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom';


function Main({ onNapraviDogadjaj }) {
 
//  RADIO BUTTONI!
  const [originalColor, setOriginalColor] = useState('');
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();
  const [NazivPicker, setNazivPicker] = useState("");
  const [NazivZaSlanje, setNazivZaSlanje] = useState("default");

  

  useEffect(() => {
    const radio1 = document.getElementById('radio1');
    const radio2 = document.getElementById('radio2');

    setOriginalColor(window.getComputedStyle(radio1.parentElement).getPropertyValue('background-color'));

    const handleClick = (event) => {
      const clickedId = event.target.id;
      if (clickedId === 'radio1' && !radio1.parentElement.classList.contains('changed-color')) {
        radio1.parentElement.style.backgroundColor = 'rgba(255, 215, 0)';
        radio1.parentElement.classList.add('changed-color');
        radio2.parentElement.style.backgroundColor = '';
        radio2.parentElement.classList.remove('changed-color');
      } else if (clickedId === 'radio2' && !radio2.parentElement.classList.contains('changed-color')) {
        radio2.parentElement.style.backgroundColor = 'rgba(255, 215, 0)';
        radio2.parentElement.classList.add('changed-color');
        radio1.parentElement.style.backgroundColor = '';
        radio1.parentElement.classList.remove('changed-color');
      } else {
        radio1.parentElement.style.backgroundColor = originalColor;
        radio1.parentElement.classList.remove('changed-color');
        radio2.parentElement.style.backgroundColor = originalColor;
        radio2.parentElement.classList.remove('changed-color');
      }
    };

    radio1.addEventListener('click', handleClick);
    radio2.addEventListener('click', handleClick);

    return () => {
      radio1.removeEventListener('click', handleClick);
      radio2.removeEventListener('click', handleClick);
    };
  }, [originalColor]);



  // [Faza 1] Uklonjen mrtav jQuery blok (kopija teme): vezivao je globalne
  // click handlere na selektore koje ova komponenta ne renderuje. Prave interakcije
  // (Header dropdown-ovi, login tabovi) vec imaju svoj React state u tim komponentama.


  registerLocale("sr-Latn", srLatn);
  //#region JAVASCRIPT
  // Za zatvaranje forme NOTIFIKACIJE
  function sakrijFormu() {
    var forma = document.querySelector('.notifikacije-forma');
    forma.style.display = 'none';
  }


  //#endregion
  //#region 
  // FUNKCIJA ZA OTVARANJE-ZATVARANJE radio-buttona KOD FILTRIRANJA !
  function toggleDiv(id) {
    var div = document.getElementById(id);
    var otherDiv = (id === 'div1') ? 'div2' : 'div1';

    if (div.style.display === 'block') {
      div.style.display = 'none';
    } else {
      div.style.display = 'block';
      document.getElementById(otherDiv).style.display = 'none';
    }
  }
  //#endregion
  // za datum kod radio buttona

  const [datumPicker, setDatumPicker] = useState(() => new Date());
  const [dateZaSlanje, setDateZaSlanje] = useState(() => new Date("2000-01-01"));

  const miniFunkcija = async () => {
    const local = (new Date(`${datumPicker.getFullYear()}-${datumPicker.getMonth()+1}-${datumPicker.getDate()}`));
    await Promise.all([
      setDateZaSlanje(local),
    ]);
  }
  
  const miniFunkcija2 = async () => {
    await Promise.all([
      setNazivZaSlanje(NazivPicker),
    ]);
  }
  
  const promeniDatum = (datum) => {
    setDatumPicker(datum);
  }
  
  
  const promeniNaziv = (event) => {
    setNazivPicker(event.target.value);
  }

  useEffect(() => {
    ucitajKorisnika();
  }, []);

  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };

  const korisnik_Id = Cookies.get('userID');
  
  const ucitajKorisnika = async () => {
    try {
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      const formatiranDatum = formatirajDatum(data.datum_rodjenja);
      data.datumrodjenja = formatiranDatum;
      setKorisnik(data);
      setmojdatum(formatiranDatum);
    } catch (error) {
      console.log(error);
    }
  };

  //-------------------------------------------------------------------------------------------------------
   //ovo sluzi za prosledjivanje dogadjajId iz Komentari.js u Dogajdaj.js pa u Main.js

  const [selectedDogadjajId, setSelectedDogadjajId] = useState();
  const handleDogadjajId = (id) => {
   
      setSelectedDogadjajId(id);
      console.log(`Primljen dogadjajId u Main: ${id}`);
    
  };

  //----------------------------------------------
  const fetchNotifikacije = async () => {
    try {
        const data = await api.get(`/Korisnik/VratiPetNotifikacijaKorisnika/${korisnik_Id}`);

       //koristimo fetchDogadjaj unutar map, jer eventName dolazi iz zasebnog API poziva. Pošto map ne podržava await, koristićemo Promise.all da sačekamo sve zahteve pre nego što ažuriramo setNotifications.
        const mappedNotifikacije = await Promise.all(
            data.map(async (not) => {
                const dogadjaj = await fetchDogadjaj(not.dogadjajId);
                const korisnik = await fetchKorisnik(not.korisnikKojiReagujeId);
                return {
                    reactionType: not.tipReakcije || null,
                    commentText: not.sadrzajReakcije || null,
                    reason: not.tipReakcije || null,
                    eventId: not.dogadjajId,
                    eventName: dogadjaj?.naslov || "Nepoznat dogadjaj",
                    organizer: korisnik?.korisnicko_Ime || "Nepoznat korisnik",
                    time: new Date(not.vreme).toLocaleString("sr-RS"),
                };
            })
        );
        setNotifications(mappedNotifikacije);
        //setNotifications(mappedNotifikacije.slice(0, 5)); // Ograniči na 5
    } catch (error) {
        console.error("Greška pri učitavanju notifikacija:", error);
    }
};



const postaviNotifikaciju = async (dogadjajId,korisnikReagujeId, tipReakcije,sadrzajReakcije, vreme, korisnikId ) => {
try {
    
  return await api.post(`/Notifikacija/PostaviNotifikaciju/${dogadjajId}/${korisnikReagujeId}/${tipReakcije}/${sadrzajReakcije}/${vreme}/${korisnikId}`);
} catch (error) {
  console.error(error);
  return null;
}
};





    //-------------------------------------------------------------------------------------------------------

   const [connection, setConnection] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [dogadjaj, setDogadjaj] = useState({});
  

    //sredi ovo - dupli kod
    async function fetchDogadjaj(id) {
      try {
          if (!id) return null;
          return await api.get(`/Dogadjaj/VratiDogadjaj/${id}`);
      } catch (error) {
          console.error('Greška pri dohvaćanju podataka o događaju:', error);
          return null;
      }
  }

      useEffect(() => {
        async function fetchDogadjaj(id) {
            try {
                if (!id) return;
                const data = await api.get(`/Dogadjaj/VratiDogadjaj/${id}`);
                setDogadjaj(data);
            } catch (error) {
                console.error('Greška pri dohvaćanju podataka o događaju:', error);
            }
        }

        if (selectedDogadjajId) { 
          fetchDogadjaj(selectedDogadjajId);
      }
  
    }, [selectedDogadjajId]);
  

    async function fetchKorisnik(korisnik_Id) {
      try {
          if (!korisnik_Id) return null;
          return await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      } catch (error) {
          console.error('Greška pri dohvaćanju podataka o korisniku:', error);
          return null;
      }
  }
  
    
    useEffect(() => {
      if (!korisnik_Id) {
          console.log("Nema userID, ne mogu da pokrenem SignalR.");
          return;
      }
  
      fetchNotifikacije();
  
      //console.log("Kreiram SignalR konekciju za userID:", korisnik_Id);
  
      const connect = new HubConnectionBuilder()
          .withUrl(`${API_BASE}/notificationHub?userId=${encodeURIComponent(korisnik_Id)}`)
          .build();
  
      connect.start()
          .then(() => console.log("Connected to SignalR hub"))
          .catch(err => console.error("Connection failed: ", err));
  
      connect.on("ReceiveNewReaction", async (reactionType, eventId, reactingUserId) => {
          console.log("New reaction received:", reactionType, "Event ID:", eventId, "Reacting User ID:", reactingUserId);
  
          const dogadjaj = await fetchDogadjaj(eventId);
          //console.log(dogadjaj);

          const korisnikKojiReaguje = await fetchKorisnik(reactingUserId);
          //console.log(korisnikKojiReaguje);

          if (dogadjaj) {
              // Čuvanje notifikacije u bazi
              await postaviNotifikaciju(
                  eventId,   // ID događaja
                  korisnikKojiReaguje.id,         // Korisnik koji reaguje
                  reactionType,           // Tip reakcije 
                  reactionType,           // Pošto SadrzajReakcije može biti isti kao tip 
                  new Date().toLocaleString("sv-SE"), // Trenutno vreme u ISO format
                  dogadjaj.iD_Kreatora    // Korisnik čija je objava (vlasnik događaja)
                              
              );
  
              // Ažuriranje lokalne liste notifikacija
              setNotifications((prev) => [
                  { 
                      reactionType, 
                      eventId, 
                      eventName: dogadjaj.naslov, 
                      organizer: korisnikKojiReaguje.korisnicko_Ime, 
                      time: new Date().toLocaleString("sr-RS")
                  },
                  ...prev.slice(0, 4) // Ograničava listu na 5 notifikacija
              ]);
          }
      });
  
      setConnection(connect);
  
      return () => {
          if (connect) {
              //console.log("Stopping SignalR connection...");
              connect.off("ReceiveNewReaction");
              connect.stop();
          }
      };
  }, []);
  


  useEffect(() => {
    if (!korisnik_Id) {
      console.log("Nema userID, ne mogu da pokrenem SignalR.");
      return;
  }

  fetchNotifikacije(); 

  //console.log("Kreiram SignalR konekciju za userID:", korisnik_Id);

  const connect = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/notificationHub?userId=${encodeURIComponent(korisnik_Id)}`)
      .build();

  connect.start()
      .then(() => console.log("Connected to SignalR hub"))
      .catch(err => console.error("Connection failed: ", err));


    connect.on("ReceiveNewComment", async (commentText, eventId, reactingUserId) => {
      console.log("New comment received:", commentText, "Event ID:", eventId, "Reacting User ID:", reactingUserId);

      const dogadjaj = await fetchDogadjaj(eventId);
      //console.log(dogadjaj);

      const korisnikKojiReaguje = await fetchKorisnik(reactingUserId);
      //console.log(korisnikKojiReaguje);


      if (dogadjaj) {
        // Čuvanje notifikacije u bazi
        await postaviNotifikaciju(
            eventId,   // ID događaja
            korisnikKojiReaguje.id,         // Korisnik koji reaguje
            commentText,           // Tip reakcije 
            commentText,           // SadrzajReakcije
            new Date().toLocaleString("sv-SE"), // Trenutno vreme u ISO format
            dogadjaj.iD_Kreatora    // Korisnik čija je objava (vlasnik događaja)
                        
        );

        // Ažuriranje lokalne liste notifikacija
        setNotifications((prev) => [
            { 
              commentText, 
                eventId, 
                eventName: dogadjaj.naslov, 
                organizer: korisnikKojiReaguje.korisnicko_Ime, 
                time: new Date().toLocaleString("sr-RS")
            },
            ...prev.slice(0, 4) // Ograničava listu na 5 notifikacija
        ]);
    }
  });

  setConnection(connect);

return () => {
  if (connect) {
    //console.log("Stopping SignalR connection...");
    connect.off("ReceiveNewComment");
    connect.stop();
  }
};

}, []);

useEffect(() => {
  if (!korisnik_Id) {
    console.log("Nema userID, ne mogu da pokrenem SignalR.");
    return;
}

fetchNotifikacije();

//console.log("Kreiram SignalR konekciju za userID:", korisnik_Id);

const connect = new HubConnectionBuilder()
    .withUrl(`${API_BASE}/notificationHub?userId=${encodeURIComponent(korisnik_Id)}`)
    .build();

connect.start()
    .then(() => console.log("Connected to SignalR hub"))
    .catch(err => console.error("Connection failed: ", err));

connect.on("ReceiveEventReport", async (reason, eventId) => {
  console.log("New report received:", reason, "Event ID:", eventId);

  const dogadjaj = await fetchDogadjaj(eventId);

  if (dogadjaj) {
    // Čuvanje notifikacije u bazi
    await postaviNotifikaciju(
        eventId,   // ID događaja
        0,         // Korisnik koji reaguje je ovde 0 jer njega ne pamtimo za prijavu.
        reason,           // Tip reakcije 
        reason,           // SadrzajReakcije
        new Date().toLocaleString("sv-SE"), // Trenutno vreme u ISO format
        dogadjaj.iD_Kreatora    // Korisnik čija je objava (vlasnik događaja)
                    
    );

    // Ažuriranje lokalne liste notifikacija
    setNotifications((prev) => [
        { 
            reason, 
            eventId, 
            eventName: dogadjaj.naslov, 
            organizer: "Neko", 
            time: new Date().toLocaleString("sr-RS")
        },
        ...prev.slice(0, 4) // Ograničava listu na 5 notifikacija
    ]);
}
});

setConnection(connect);

return () => {
if (connect) {
  //console.log("Stopping SignalR connection...");
  connect.off("ReceiveEventReport");
  connect.stop();
}
};

}, []);
  

  //   console.log("AJDI0:" + dogadjaj.iD_Kreatora);
  //   useEffect(() => {
  //     console.log(dogadjaj);
  //     console.log("AJDI1:" + dogadjaj.iD_Kreatora);
  //     if (!dogadjaj.iD_Kreatora) return;
  //     console.log("AJDI2:" + dogadjaj.iD_Kreatora);
  //     const connect = new HubConnectionBuilder()
  //     .withUrl("${API_BASE}/notificationHub?userId=" + encodeURIComponent(dogadjaj.iD_Kreatora))
  //     .build();
  //     console.log("AJDI3:" + dogadjaj.iD_Kreatora);
  
  // connect.start()
  //     .then(() => console.log("Connected to SignalR hub"))
  //     .catch(err => console.error("Connection failed: ", err));
  
  
  //       connect.on("ReceiveNewComment", (commentText, eventId) => {
  //         console.log("New comment received:", commentText, "Event ID:", eventId);
  //         setNotifications((prevNotifications) => [...prevNotifications, commentText]);
  //       });
        
  
  
  //     setConnection(connect);
  
  //     return () => {
  //       if (connection) {
  //         connection.stop();
  //       }
  //     };
  //   }, [dogadjaj.iD_Kreatora]);
    //-------------------------------------------------------------------------------------------------------


const navigate = useNavigate();
const handleClickObjava = (id, obj) => {
  navigate(`/objava/${id}`, { state: { obj } });
};

  return (
    <div>
      <main>
        <div className="main-section">
          <div className="container">
            <div className="main-section-data">
              <div className="row">
                <div className="col-lg-3 col-md-4 pd-left-none no-pd">
                  <div className="main-left-sidebar no-margin">
                    <div className="user-data full-width ">
                      <div className="user-profile d-none d-sm-block"> {/* OVIM SAM SAKRIO USER-PROFILE ZA MOBILNE TELEFONE */}
                        <div className="username-dt">
                          {korisnik ? (
                          <div className="usr-pic">
                            <img className="profilnaslikahomepage"
                                    src={korisnik.korisnikImage ? `${API_BASE}/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/100x100"} />
                          </div>) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                        </div>
                        {korisnik ? (
                        <div className="user-specs">
                          <h3>{korisnik.ime} {korisnik.prezime}</h3>
                          <span>@{korisnik.korisnicko_Ime}</span>
                        </div>
                     ) : (
                      <p>Korisnik nije dostupan</p>
                    )}
                      </div>{/*user-profile end*/}
                      <ul className="user-fw-status">
                        <li>
                          <Link to="/profil">Vidi profil</Link>
                        </li>
                      </ul>
                    </div>{/*user-data end*/}

                    {/* FILTRACIJA */}
                    <div className="radio-div">
                      <p className="filtriraj">Filtriraj sve dogadjaje po:</p>
                      <label className="radio-label radio-label1" htmlFor="radio1">
                        <img src="images/date32.ico" />
                        <input type="radio" className="radio-input" name="exampleRadios" id="radio1" defaultValue="option1" onClick={() => toggleDiv('div1')} />Datum
                      </label>
                      <label className="radio-label radio-label2" htmlFor="radio2">
                        <img src="images/abc96.png" />
                        <input type="radio" className="radio-input" name="exampleRadios" id="radio2" defaultValue="option2" onClick={() => toggleDiv('div2')} />Naziv
                      </label>
                    </div>
                    <div id="div1" style={{ display: 'none' }}>
                      <h2 />
                      <p>
                      </p>
                      <div className="pretrazivanje-datum">
                        <div className="div-naslov">
                          <h3>Pretrazi po datumu:</h3>
                        </div>
                        <div className="suggestion-usd">
                          <div>
                            <DatePicker
                              locale="sr-Latn" //srpski jezik
                              minDate={new Date()}
                              //dateFormat="dd.MM.yyyy" // ormat datuma(01.01.2001)
                              /*dayClassName={(date) =>
                                date.getDay() === 0 || date.getDay() === 6 ? "weekend-day" : ""
                              } */
                              selected={datumPicker}
                              onChange={(date) => promeniDatum(date)}   
                              placeholderText="Izaberite datum"
                            />
                          </div>
                        </div>


                        <button className="pretrazi-button" onClick={() => { miniFunkcija() }}>Pretrazi</button>
                      </div>
                      <p />
                    </div>
                    <div id="div2" style={{ display: 'none' }}>
                      <h2 />
                      <p>
                      </p><div className="pretrazivanje-naziv">
                        <div className="div-naslov">
                          <h3>Pretrazi po nazivu:</h3>

                        </div>
                        <p className="suggestion-usd">
                        <input id="NazivPromena"className="datum-input" type="text" onChange={(event) => promeniNaziv(event)} />
                        </p>
                        <button className="pretrazi-button" type="submit" onClick={() => {miniFunkcija2()}}>Pretrazi</button>
                      </div>
                      <p />
                    </div>


                  </div> {/*main-left-sidebar end*/}
                </div>
                <div className="col-lg-6 col-md-8 no-pd">
                  <div className="main-ws-sec">
                    <div className="post-topbar">
                      <div className="user-picy">
                      {korisnik ? (
                          <div className="usr-pic">
                            <img className="profilnaslikahomepageobjava"
                                    src={korisnik.korisnikImage ? `${API_BASE}/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/100x100"} />
                          </div>) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                      </div>
                      <div className="post-st">
                        <ul>
                          {/* <li><a class="post_project" href="#" title="">Post a Project</a></li> */}
                          <li><a className="post-jb active" href="#" onClick={(e) => { e.preventDefault(); onNapraviDogadjaj?.(); }}>Napravi dogadjaj</a></li>
                        </ul>
                      </div>{/*post-st end*/}
                    </div>{/*post-topbar end*/}
                    <div className="posts-section" >
                      <Dogadjaj primljenDatum={dateZaSlanje} primljenNaziv={NazivZaSlanje} onDogadjajIdChange={handleDogadjajId} />

                      
                    </div>{/*posts-section end*/}
                    <div className="notifikacije-forma" style={{ display: 'none' }}>
                      <div className="notifikacije-content">
                        <div className="widget1 widget-jobs1">
                          <div className="sd-title1">
                            <h3>Notifikacije</h3>
                            {/* <i class="la la-ellipsis-v"></i> */}
                          </div>
                          <div className="jobs-list1">
                            <div className="job-info1">
                              <div className="job-details1">
                                <p>Korisnik Ime Prezime je reagovao/la na vas dogadjaj ImeDogadjaja: Zainteresovan.</p>
                              </div>
                              <div className="hr-rate1">
                                <span>Danas, 17:38</span>
                              </div>
                            </div>{/*job-info end*/}
                            <div className="job-info1">
                              <div className="job-details1">
                                <p>Korisnik Ime Prezime je dodao komentar na vas dogadjaj ImeDogadjaja.</p>
                              </div>
                              <div className="hr-rate1">
                                <span>Sreda, 20:20</span>
                              </div>
                            </div>{/*job-info end*/}
                            <div className="job-info1">
                              <div className="job-details1">
                                <p>Lorem ipsum dolor sit amet, consec adipiscing elit..</p>
                              </div>
                              <div className="hr-rate1">
                                <span>Petak, 18:04</span>
                              </div>
                            </div>{/*job-info end*/}
                            <div className="job-info1">
                              <div className="job-details1">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit..</p>
                              </div>
                              <div className="hr-rate1">
                                <span>Petak, 9:18</span>
                              </div>
                            </div>{/*job-info end*/}
                            <div className="job-info1">
                              <div className="job-details1">
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit..</p>
                              </div>
                              <div className="hr-rate1">
                                <span>Subota, 21:36</span>
                              </div>
                            </div>{/*job-info end*/}
                          </div>{/*jobs-list end*/}
                        </div>{/*widget-jobs end*/}
                        <button className="izlaz-dugme" onClick={sakrijFormu}>X</button>
                      </div>
                    </div>
                  </div>{/*main-ws-sec end*/}
                </div>
                <div className="col-lg-3 pd-right-none no-pd">
                  <div className="right-sidebar">
                    {/* KVADRAT ZA NESTO DODATNO U RIGHT-SIDEBARU */}
                    {/* <div class="widget widget-about">
        										<img src="images/wd-logo.png" alt="">
        										<h3>Track Time on EventBox</h3>
        										<span>Pay only for the Hours worked</span>
        										<div class="sign_link">
        											<h3><a href="#" title="">Sign up</a></h3>
        											<a href="#" title="">Learn More</a>
        										</div> */}
                    {/*widget-about end*/}
                    <div className="widget widget-jobs">
                      <div className="sd-title">
                        <h3>Notifikacije</h3>
                        <i className="la la-ellipsis-v" />
                      </div>
                      
                      <div className="jobs-list">
                     
                      {notifications.length > 0 ? (
                        notifications.map((notif, index) => (
                          <div className="job-info" key={index} onClick={() => handleClickObjava(notif.eventId, korisnik)}>
                            <div className="job-details">
                              <p>{notif.organizer} je {notif.reactionType ? " reagovao" 
                              : notif.reason ? " prijavio" 
                              : notif.commentText ? " komentarisao" 
                              : ""}  '{notif.reactionType || notif.commentText || ""}' 
                              {notif.reactionType ? " na" 
                                : notif.reason ? " " 
                                : notif.commentText ? " na" 
                                : ""} Vaš događaj {notif.eventName}.</p>
                            </div>
                            <div className="hr-rate">
                              <span>{notif.time}</span> 
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={{ textAlign: "center", color: "gray", marginTop: "10px" }}>
                          Trenutno nema notifikacija.
                        </p>
                      )}

  
                      </div>{/*jobs-list end*/}
                    </div>{/*widget-jobs end*/}
                    {/* Predlog za PRONALAZENJE LJUDI ! ! */}
                    {/* <div class="widget suggestions full-width">
        										<div class="sd-title">
        											<h3>Most Viewed People</h3>
        											<i class="la la-ellipsis-v"></i>
        										</div> <!- -sd-title end- ->
        										<div class="suggestions-list">
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>Jessica William</h4>
        													<span>Graphic Designer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>John Doe</h4>
        													<span>PHP Developer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>Poonam</h4>
        													<span>Wordpress Developer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>Bill Gates</h4>
        													<span>C &amp; C++ Developer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>Jessica William</h4>
        													<span>Graphic Designer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="suggestion-usd">
        												<img src="http://via.placeholder.com/35x35" alt="">
        												<div class="sgt-text">
        													<h4>John Doe</h4>
        													<span>PHP Developer</span>
        												</div>
        												<span><i class="la la-plus"></i></span>
        											</div>
        											<div class="view-more">
        												<a href="#" title="">View More</a>
        											</div>
        										</div> <!- -suggestions-list end- ->
        									</div> */}
                  </div>{/*right-sidebar end*/}
                </div>
              </div>
            </div>{/* main-section-data end*/}
          </div>
        </div>
      </main>

    </div>
  )
}

export default Main