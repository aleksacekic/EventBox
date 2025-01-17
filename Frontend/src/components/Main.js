import React from 'react'
import Dogadjaj from './Dogadjaj'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useEffect, useState } from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import { Link } from 'react-router-dom';
import $ from 'jquery';
import moment from 'moment';
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom';

function Main() {
 
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



  // JQUERI SVE UBACENO!
  useEffect(() => {
    $(document).ready(function() {
      $(".zzatvaranje > ul > li > a").on("click", function(){
        $(".post-popup.pst-pj").addClass("active");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".zzatvaranje > ul > li > a").on("click", function(){
        $(".post-popup.pst-pj").removeClass("active");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    $(".zzatvaranje > ul > li > a").on("click", function(){
        $(".post-popup.job_post").addClass("active");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".zzatvaranje > ul > li > a").on("click", function(){
        $(".post-popup.job_post").removeClass("active");
        $(".wrapper").removeClass("overlay");
        return false;
    });
    

    //  ============= POST PROJECT POPUP FUNCTION =========

    $(".post_project").on("click", function(){
        $(".post-popup.pst-pj").addClass("active");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".post-project > a").on("click", function(){
        $(".post-popup.pst-pj").removeClass("active");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= POST JOB POPUP FUNCTION =========

    $(".post-jb").on("click", function(){
        $(".post-popup.job_post").addClass("active");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".post-project > a").on("click", function(){
        $(".post-popup.job_post").removeClass("active");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= SIGNIN CONTROL FUNCTION =========

    $('.sign-control li').on("click", function(){
        var tab_id = $(this).attr('data-tab');
        $('.sign-control li').removeClass('current');
        $('.sign_in_sec').removeClass('current');
        $(this).addClass('current animated fadeIn');
        $("#"+tab_id).addClass('current animated fadeIn');
        return false;
    });

    //  ============= SIGNIN TAB FUNCTIONALITY =========

    $('.signup-tab ul li').on("click", function(){
        var tab_id = $(this).attr('data-tab');
        $('.signup-tab ul li').removeClass('current');
        $('.dff-tab').removeClass('current');
        $(this).addClass('current animated fadeIn');
        $("#"+tab_id).addClass('current animated fadeIn');
        return false;
    });

    //  ============= SIGNIN SWITCH TAB FUNCTIONALITY =========

    $('.tab-feed ul li').on("click", function(){
        var tab_id = $(this).attr('data-tab');
        $('.tab-feed ul li').removeClass('active');
        $('.product-feed-tab').removeClass('current');
        $(this).addClass('active animated fadeIn');
        $("#"+tab_id).addClass('current animated fadeIn');
        return false;
    });

    //  ============= COVER GAP FUNCTION =========

    var gap = $(".container").offset().left;
    $(".cover-sec > a, .chatbox-list").css({
        "right": gap
    });

    //  ============= OVERVIEW EDIT FUNCTION =========

    $(".overview-open").on("click", function(){
        $("#overview-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#overview-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= EXPERIENCE EDIT FUNCTION =========

    $(".exp-bx-open").on("click", function(){
        $("#experience-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#experience-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= EDUCATION EDIT FUNCTION =========

    $(".ed-box-open").on("click", function(){
        $("#education-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#education-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= LOCATION EDIT FUNCTION =========

    $(".lct-box-open").on("click", function(){
        $("#location-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#location-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= SKILLS EDIT FUNCTION =========

    $(".skills-open").on("click", function(){
        $("#skills-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#skills-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= ESTABLISH EDIT FUNCTION =========

    $(".esp-bx-open").on("click", function(){
        $("#establish-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#establish-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= CREATE PORTFOLIO FUNCTION =========

    $(".gallery_pt > a").on("click", function(){
        $("#create-portfolio").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#create-portfolio").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  ============= EMPLOYEE EDIT FUNCTION =========

    $(".emp-open").on("click", function(){
        $("#total-employes").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#total-employes").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });

    //  =============== Ask a Question Popup ============

    $(".ask-question").on("click", function(){
        $("#question-box").addClass("open");
        $(".wrapper").addClass("overlay");
        return false;
    });
    $(".close-box").on("click", function(){
        $("#question-box").removeClass("open");
        $(".wrapper").removeClass("overlay");
        return false;
    });


    //  ============== ChatBox ============== 


    $(".chat-mg").on("click", function(){
        $(this).next(".conversation-box").toggleClass("active");
        return false;
    });
    $(".close-chat").on("click", function(){
        $(".conversation-box").removeClass("active");
        return false;
    });

    //  ================== Edit Options Function =================


    $(".ed-opts-open").on("click", function(){
        $(this).next(".ed-options").toggleClass("active");
        return false;
    });




    //  ============ Notifications Open =============

    $(".not-box-open").on("click", function(){
        $(this).next(".notification-box").toggleClass("active");
    });

    // ============= User Account Setting Open ===========

    $(".user-info").on("click", function(){
        $(this).next(".user-account-settingss").toggleClass("active");
    });

    //  ============= FORUM LINKS MOBILE MENU FUNCTION =========

    $(".forum-links-btn > a").on("click", function(){
        $(".forum-links").toggleClass("active");
        return false;
    });
    $("html").on("click", function(){
        $(".forum-links").removeClass("active");
    });


    });
  }, []);


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
  
  const ucitajKorisnika = () => {
    const korisnik_Id = Cookies.get('userID');
    const url = `http://localhost:5153/Korisnik/VratiKorisnika_ID/${korisnik_Id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        //console.log(data.datum_rodjenja);
        const formatiranDatum = formatirajDatum(data.datum_rodjenja);
        data.datumrodjenja = formatiranDatum;
        console.log(formatiranDatum);
        setKorisnik(data);
        setmojdatum(formatiranDatum);
      })
      .catch((error) => {
        console.log(error);
      });
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
                                    src={korisnik.korisnikImage ? `http://localhost:5153/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/100x100"} />
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
                                    src={korisnik.korisnikImage ? `http://localhost:5153/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/100x100"} />
                          </div>) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                      </div>
                      <div className="post-st">
                        <ul>
                          {/* <li><a class="post_project" href="#" title="">Post a Project</a></li> */}
                          <li><a className="post-jb active" href="#">Napravi dogadjaj</a></li>
                        </ul>
                      </div>{/*post-st end*/}
                    </div>{/*post-topbar end*/}
                    <div className="posts-section" >
                      <Dogadjaj primljenDatum={dateZaSlanje} primljenNaziv={NazivZaSlanje} />

                      
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
                        <div className="job-info">
                          <div className="job-details">
                            <p>Korisnik Ime Prezime je reagovao/la na vas dogadjaj ImeDogadjaja: Zainteresovan.</p>
                          </div>
                          <div className="hr-rate">
                            <span>Danas, 17:38</span>
                          </div>
                        </div>{/*job-info end*/}
                        <div className="job-info">
                          <div className="job-details">
                            <p>Korisnik Ime Prezime je dodao komentar na vas dogadjaj ImeDogadjaja.</p>
                          </div>
                          <div className="hr-rate">
                            <span>Sreda, 20:20</span>
                          </div>
                        </div>{/*job-info end*/}
                        <div className="job-info">
                          <div className="job-details">
                            <p>Lorem ipsum dolor sit amet, consec adipiscing elit..</p>
                          </div>
                          <div className="hr-rate">
                            <span>Petak, 18:04</span>
                          </div>
                        </div>{/*job-info end*/}
                        <div className="job-info">
                          <div className="job-details">
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit..</p>
                          </div>
                          <div className="hr-rate">
                            <span>Petak, 9:18</span>
                          </div>
                        </div>{/*job-info end*/}
                        <div className="job-info">
                          <div className="job-details">
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit..</p>
                          </div>
                          <div className="hr-rate">
                            <span>Subota, 21:36</span>
                          </div>
                        </div>{/*job-info end*/}
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