import { api } from '../api';
import React from 'react'
import EventFeed from './EventFeed'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState } from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/date';
import Avatar from './Avatar';
import { useAuth } from '../auth';
import { useNotifications, getNotificationText, formatDateTime } from '../notifications';
import { useNavigate } from 'react-router-dom';


function Main({ onCreateEvent, noviDogadjaj }) {

  const { userId } = useAuth();
  const { notifications } = useNotifications();
  const [korisnik, setKorisnik] = useState(null);
  const [NazivPicker, setNazivPicker] = useState("");
  const [NazivZaSlanje, setNazivZaSlanje] = useState("default");

  // Koji filter je trenutno aktivan - jedan izvor istine umesto rucnog
  // pokazivanja/sakrivanja div-ova preko document.getElementById.
  const [filterMode, setFilterMode] = useState('sve'); // 'sve' | 'datum' | 'naziv'
  // Menja se samo kad se filter potpuno resetuje - <EventFeed key={feedKey}>
  // se onda ponovo montira iz pocetka i sam ucita opsti feed (cisto, bez
  // dodatne logike ovde za "vracanje" stare liste).
  const [feedKey, setFeedKey] = useState(0);

  registerLocale("sr-Latn", srLatn);
  // za datum kod radio buttona

  const [datumPicker, setDatumPicker] = useState(() => new Date());
  const [dateZaSlanje, setDateZaSlanje] = useState(() => new Date("2000-01-01"));

  const applyDateFilter = () => {
    const local = (new Date(`${datumPicker.getFullYear()}-${datumPicker.getMonth()+1}-${datumPicker.getDate()}`));
    setDateZaSlanje(local);
  }

  const applyTitleFilter = () => {
    setNazivZaSlanje(NazivPicker);
  }

  const resetFilter = () => {
    setFilterMode('sve');
    setDatumPicker(new Date());
    setDateZaSlanje(new Date("2000-01-01"));
    setNazivPicker("");
    setNazivZaSlanje("default");
    setFeedKey(k => k + 1);
  }

  const handleDateChange = (datum) => {
    setDatumPicker(datum);
  }


  const handleTitleChange = (event) => {
    setNazivPicker(event.target.value);
  }

  useEffect(() => {
    loadUser();
  }, []);

  const korisnik_Id = userId;
  
  const loadUser = async () => {
    try {
      const data = await api.get(`/api/users/${korisnik_Id}`);
      const formatiranDatum = formatDate(data.datum_rodjenja);
      data.datumrodjenja = formatiranDatum;
      setKorisnik(data);
    } catch (error) {
      console.log(error);
    }
  };

  //-------------------------------------------------------------------------------------------------------
  


  // [SignalR] Konekcija za notifikacije premestena u src/notifications.jsx
  // (NotificationsProvider), montiran jednom u App.jsx - da radi na svakoj
  // strani, ne samo dok je korisnik na /pocetna. Vidi useNotifications() gore.

const navigate = useNavigate();
const openEvent = (id) => {
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
                            <Avatar className="profilnaslikahomepage" slika={korisnik.korisnikImage} ime={korisnik.ime} />
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
                            <Avatar className="profilnaslikahomepageobjava" slika={korisnik.korisnikImage} ime={korisnik.ime} />
                          </div>) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                      </div>
                      <div className="post-st">
                        <ul>
                          {/* <li><a class="post_project" href="#" title="">Post a Project</a></li> */}
                          <li><a className="post-jb active" href="#" onClick={(e) => { e.preventDefault(); onCreateEvent?.(); }}>Napravi dogadjaj</a></li>
                        </ul>
                      </div>{/*post-st end*/}
                    </div>{/*post-topbar end*/}

                    <div className="feed-filter">
                      <div className="feed-filter-tabs">
                        <button
                          type="button"
                          className={filterMode === 'sve' ? 'active' : ''}
                          onClick={resetFilter}
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
                            onChange={(datum) => handleDateChange(datum)}
                            placeholderText="Izaberite datum"
                            dateFormat="d.M.yyyy."
                            calendarClassName="eb-calendar"
                            className="feed-filter-input"
                          />
                          <button className="feed-filter-search-btn" onClick={applyDateFilter}>Pretrazi</button>
                        </div>
                      )}

                      {filterMode === 'naziv' && (
                        <div className="feed-filter-controls">
                          <input
                            type="text"
                            className="feed-filter-input"
                            placeholder="Naziv dogadjaja..."
                            value={NazivPicker}
                            onChange={(event) => handleTitleChange(event)}
                          />
                          <button className="feed-filter-search-btn" onClick={applyTitleFilter}>Pretrazi</button>
                        </div>
                      )}

                      {(dateZaSlanje.getTime() !== new Date("2000-01-01").getTime() || NazivZaSlanje !== "default") && (
                        <div className="feed-filter-active-note">
                          <span>
                            {NazivZaSlanje !== "default"
                              ? `Prikazani dogadjaji po nazivu: "${NazivZaSlanje}"`
                              : `Prikazani dogadjaji za datum: ${datumPicker.toLocaleDateString('sr-Latn')}`}
                          </span>
                          <button className="feed-filter-reset" onClick={resetFilter}>Prikazi sve</button>
                        </div>
                      )}
                    </div>{/*feed-filter end*/}

                    <div className="posts-section" >
                      <EventFeed key={feedKey} primljenDatum={dateZaSlanje} primljenNaziv={NazivZaSlanje} noviDogadjaj={noviDogadjaj} />


                    </div>{/*posts-section end*/}
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
                          <div className="job-info" key={notif.id} onClick={() => openEvent(notif.dogadjajId)}>
                            <div className="job-details">
                              <p>{getNotificationText(notif)}</p>
                            </div>
                            <div className="hr-rate">
                              <span>{formatDateTime(notif.vreme)}</span>
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