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
import { useAuth } from '../auth';
import { useNotifications, tekstNotifikacije, uLokalnoVreme } from '../notifications';
import { useNavigate } from 'react-router-dom';


function Main({ onNapraviDogadjaj, noviDogadjaj }) {

  const { userId } = useAuth();
  const { notifications } = useNotifications();
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();
  const [NazivPicker, setNazivPicker] = useState("");
  const [NazivZaSlanje, setNazivZaSlanje] = useState("default");

  // Koji filter je trenutno aktivan - jedan izvor istine umesto rucnog
  // pokazivanja/sakrivanja div-ova preko document.getElementById.
  const [filterMode, setFilterMode] = useState('sve'); // 'sve' | 'datum' | 'naziv'
  // Menja se samo kad se filter potpuno resetuje - <Dogadjaj key={feedKey}>
  // se onda ponovo montira iz pocetka i sam ucita opsti feed (cisto, bez
  // dodatne logike ovde za "vracanje" stare liste).
  const [feedKey, setFeedKey] = useState(0);

  registerLocale("sr-Latn", srLatn);
  //#region JAVASCRIPT
  // Za zatvaranje forme NOTIFIKACIJE
  function sakrijFormu() {
    var forma = document.querySelector('.notifikacije-forma');
    forma.style.display = 'none';
  }


  //#endregion
  // za datum kod radio buttona

  const [datumPicker, setDatumPicker] = useState(() => new Date());
  const [dateZaSlanje, setDateZaSlanje] = useState(() => new Date("2000-01-01"));

  const primeniDatumFilter = () => {
    const local = (new Date(`${datumPicker.getFullYear()}-${datumPicker.getMonth()+1}-${datumPicker.getDate()}`));
    setDateZaSlanje(local);
  }

  const primeniNazivFilter = () => {
    setNazivZaSlanje(NazivPicker);
  }

  const resetujFilter = () => {
    setFilterMode('sve');
    setDatumPicker(new Date());
    setDateZaSlanje(new Date("2000-01-01"));
    setNazivPicker("");
    setNazivZaSlanje("default");
    setFeedKey(k => k + 1);
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

  const korisnik_Id = userId;
  
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

    //-------------------------------------------------------------------------------------------------------

    const [dogadjaj, setDogadjaj] = useState({});

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
  


  // [SignalR] Konekcija za notifikacije premestena u src/notifications.jsx
  // (NotificationsProvider), montiran jednom u App.jsx - da radi na svakoj
  // strani, ne samo dok je korisnik na /pocetna. Vidi useNotifications() gore.

const navigate = useNavigate();
const handleClickObjava = (id) => {
  navigate(`/objava/${id}`);
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

                    <div className="feed-filter">
                      <div className="feed-filter-tabs">
                        <button
                          type="button"
                          className={filterMode === 'sve' ? 'active' : ''}
                          onClick={resetujFilter}
                        >
                          Svi dogadjaji
                        </button>
                        <button
                          type="button"
                          className={filterMode === 'datum' ? 'active' : ''}
                          onClick={() => setFilterMode('datum')}
                        >
                          Po datumu
                        </button>
                        <button
                          type="button"
                          className={filterMode === 'naziv' ? 'active' : ''}
                          onClick={() => setFilterMode('naziv')}
                        >
                          Po nazivu
                        </button>
                      </div>

                      {filterMode === 'datum' && (
                        <div className="feed-filter-controls">
                          <DatePicker
                            locale="sr-Latn"
                            minDate={new Date()}
                            selected={datumPicker}
                            onChange={(datum) => promeniDatum(datum)}
                            placeholderText="Izaberite datum"
                            dateFormat="d.M.yyyy."
                            calendarClassName="eb-calendar"
                            className="feed-filter-input"
                          />
                          <button className="feed-filter-search-btn" onClick={primeniDatumFilter}>Pretrazi</button>
                        </div>
                      )}

                      {filterMode === 'naziv' && (
                        <div className="feed-filter-controls">
                          <input
                            type="text"
                            className="feed-filter-input"
                            placeholder="Naziv dogadjaja..."
                            value={NazivPicker}
                            onChange={(event) => promeniNaziv(event)}
                          />
                          <button className="feed-filter-search-btn" onClick={primeniNazivFilter}>Pretrazi</button>
                        </div>
                      )}

                      {(dateZaSlanje.getTime() !== new Date("2000-01-01").getTime() || NazivZaSlanje !== "default") && (
                        <div className="feed-filter-active-note">
                          <span>
                            {NazivZaSlanje !== "default"
                              ? `Prikazani dogadjaji po nazivu: "${NazivZaSlanje}"`
                              : `Prikazani dogadjaji za datum: ${datumPicker.toLocaleDateString('sr-Latn')}`}
                          </span>
                          <button className="feed-filter-reset" onClick={resetujFilter}>Prikazi sve</button>
                        </div>
                      )}
                    </div>{/*feed-filter end*/}

                    <div className="posts-section" >
                      <Dogadjaj key={feedKey} primljenDatum={dateZaSlanje} primljenNaziv={NazivZaSlanje} onDogadjajIdChange={handleDogadjajId} noviDogadjaj={noviDogadjaj} />


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
        										<img src="/images/wd-logo.png" alt="">
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
                        notifications.map((notif) => (
                          <div className="job-info" key={notif.id} onClick={() => handleClickObjava(notif.dogadjajId)}>
                            <div className="job-details">
                              <p>{tekstNotifikacije(notif)}</p>
                            </div>
                            <div className="hr-rate">
                              <span>{uLokalnoVreme(notif.vreme)?.toLocaleString('sr-RS')}</span>
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