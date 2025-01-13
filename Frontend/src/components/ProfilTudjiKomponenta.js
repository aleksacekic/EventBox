import React from 'react'
import lightBlueImage from '../lightblue.jpg';
import HideShowMapa from './Hide&ShowMapa';
import { useEffect, useState } from 'react';
import moment from 'moment';
import $ from 'jquery';
import Cookies from 'js-cookie'
import { useNavigate } from 'react-router-dom';

function ProfilTudjiKomponenta() {
 

  const navigate = useNavigate();
  

  const ucitajKorisnika = () => {
    const korisnik_Id = Cookies.get('tudjiID');
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


  const [activeIndex, setActiveIndex] = useState(null);
  const toggleOptions = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Zatvori opciju ako je već otvorena
    } else {
      setActiveIndex(index); // Otvori opciju
    }
  };


  useEffect(() => {
    // Inicijalizacija jQuery koda nakon montiranja komponente
    $(document).ready(function() {
      $('.tab-feed ul li').on("click", function(){
        var tab_id = $(this).attr('data-tab');
        $('.tab-feed ul li').removeClass('active');
        $('.product-feed-tab').removeClass('current');
        $(this).addClass('active animated fadeIn');
        $("#" + tab_id).addClass('current animated fadeIn');
        return false;
      });
    });
  }, []);

  
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

  

  const [dogadjaji, setDogadjaji] = useState([]);
  const [brojPosiljke, setBrojPosiljke] = useState(1);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // za dodavanje slike

  useEffect(() => {
    ucitajDogadjaje();
  }, [brojPosiljke]);


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  };

 

 
  
  const handleCameraIconClick = () => {
  setShowOptions(!showOptions);
};




  
  const UcitajDalje = () => {
    setBrojPosiljke(prevBrojPosiljke => prevBrojPosiljke + 1);
  }

  const ucitajDogadjaje = () => {
    //console.log("Usao sam u ClassicFetch");
    const korisnik_Id = Cookies.get('tudjiID');
    const url = `http://localhost:5153/Korisnik/VratiDogadjajeKorisnika/${korisnik_Id}/${brojPosiljke}/${ukupnoElemenata}`;
    fetch(url,
      {
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
      }).catch(error =>{
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
          
        }
        else{
          console.log("Nisam uso u data fajl")    
        }
      }).catch(error =>{
        console.log("");
      })

    //console.log("Izlazim iz ClassicFetch");
  };
  
  // BRISANJE SLIKE KORISNIKU
  const handleDeleteImage = () => {
    const korisnik_Id = Cookies.get('tudjiID');
    const url = `http://localhost:5153/Korisnik/IzbrisiSlikuKorisnika/${korisnik_Id}`;
  
    fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          console.log(response);
          window.location.reload(); 
        } else {
          console.log("GRESKA PRILIKOM BRISANJA SLIKE");
        }
      })
      .catch(error => {

      });
  };
  

  useEffect(() => {
    ucitajKorisnika();
  }, []);

  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };
  
 
  const odrediHoroskopskiZnak = (datum) => {
    console.log(mojdatum);
    console.log(datum);
    const [dan, mesec, godina] = datum.split('.');
    const isValidDate = (d, m, y) => {
      const date = new Date(y, m - 1, d);
      return date.getDate() == d && date.getMonth() + 1 == m && date.getFullYear() == y;
    };
  
    if (!isValidDate(parseInt(dan), parseInt(mesec), parseInt(godina))) {
      console.log('Neispravan format datuma.');
      return null;
    }
  
    const d = parseInt(dan, 10);
    const m = parseInt(mesec, 10);
  
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) {
      return 'Vodolija';
    } else if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) {
      return 'Riba';
    } else if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) {
      return 'Ovan';
    } else if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) {
      return 'Bik';
    } else if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) {
      return 'Blizanac';
    } else if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) {
      return 'Rak';
    } else if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) {
      return 'Lav';
    } else if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) {
      return 'Devica';
    } else if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) {
      return 'Vaga';
    } else if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) {
      return 'Skorpija';
    } else if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) {
      return 'Strelac';
    } else if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) {
      return 'Jarac';
    } else {
      return 'Nepoznat znak';
    }
  };

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
  
  const tekstHoroskopskogZnaka = {
    Vodolija: 'Vodolije, ova godina će biti obeležena prekretnicama koje bi mogle zauvek da promene putanju vašeg života. Produbljujete svoje najbliže veze i stvarate doživotna sećanja sa ljudima oko vas. Uverite se da ste u mogućnosti da zastanete i pomirišete ruže dok prolazite pored njih. Ove godine će vam biti važno da razmislite o putu karijere na kojem ste. Ono što ćete shvatiti radeći ovo je da ćete možda biti srećniji nego što ste sebi dozvoljavali da budete u prošlosti. Ako shvatite da ste se zadovoljili poslom koji obavljate, ova trenutna pauza će vam dati jasnoću kako da se odvojite i konačno napravite korak da počnete iznova.',
    Riba: 'Ribe, ove godine biće o samosvesti i ličnoj odgovornosti za sebe, ali ne i samopokoravanju i samosažaljenju. Snažni ste i samouvereni onoliko koliko sebi dozvoljavate da budete, i vidim da pronalazite snagu da kopate u novu i poboljšanu verziju sebe jednostavnim otpuštanjem starih navika. Bilo da ovo dolazi od odvajanja od vašeg trenutno haosa ili da kreće od davanja vremena novim projektima i mogućnostima za rad, čini se da se vaš identitet pomera na bolje.',
    Ovan: 'S obzirom na to da 2023. godina počinje sa srećnim Jupiterom u vašem znaku (do maja), iskoristite prvi kvartal 2023. da rizikujete i videćete rezultate. To znači da se u smislu ljubavi, stila života i karijere od vas traži da izađete iz svoje zone komfora i vizualizujete život koji želite umesto da zaostajete sa životom koji imate. To ne znači da se ne treba da budete zahvalni na sadašnjem trenutku, ali to znači da ćete biti primorani da razmišljate van okvira i idete za onim što želite.',
    Bik: '2023. vam donosi toliko novih mogućnosti da se proširite i prerastete u verziju sebe kakva ste oduvek želeli da budete. Međutim, to će doći uz naknadu vašeg ega. Ne možete da nastavite da radite stvari na isti stari način dok ovo novo poglavlje u vašem životu počinje. Razmislite o tome na ovaj način: jezik vaše prethodne verzije je drugačiji jezik od onog koji sada morate da „govorite“. Savet? Oslobodite se napetosti, tenzije i agresije dok razgovarate s ljudima.',
    Blizanac: 'Blizanci, sa drugim vazdušnim znakom Vagom koja osvetljavaju pomračenje Sunca u oktobru, prva polovina godine će se baviti eksperimentisanjem i otkrivanjem šta zaista želite od svog života pre nego što se posvetite novoj i usklađenoj svrsi u drugom kvartalu 2023. Vaš fokus će biti na negovanju zdravih odnosa svih vrsta. Da li i dalje imate ljude koji se zadržavaju u vašem krugu, a svesno (ili podsvesno) vas sprečavaju da ostvarite svoj puni potencijal?',
    Rak: 'Rakovi, 2023. godina će vas testirati da se oslobodite svoje prošlosti i svake težine koja je proizašla iz nje. Bez obzira na to da li se borite da pravilno razmišljate, održavate energiju ili dobijete nepokolebljiv osećaj samopouzdanja, pokušajte da skinete deo krivice i pritiska sa svojih ramena tako što ćete se povući tokom 2023. Iskoristite ovu godinu da biste uklonili svaki preostali osećaj griže savesti ili samonedovoljnosti.',
    Lav: 'Lavovi, sa Jupiterom koji ulazi u drugi fiksni znak - Bika - u maju, očekujte da ćete ove godine biti posebno blagosloveni u sferi ljubavi i karijere. Međutim, vaša najveća lekcija i jedina stvar od koje morate biti spremni da odustanete je negativni narativ o sebi i samokritičnost. Vaša osuđujuća priroda ometa vašu krajnju sreću. Dok ne budete mogli da prihvatite ljudskost u sebi, borićete se da je prihvatite i u drugima.',
    Devica: 'Device, 2023. će biti do vrha ispunjena prilikama za slavlje. Ne morate da čekate rođendan ili godišnjice da biste okupili svoje najbliže i nakratko postali centar pažnje. U stvari, imaćete toliko neverovatnih dostignuća koja zahtevaju okupljanje ljudi i flaše proseka ove godine. Sa Jupiterom koji u maju ulazi u zemljani znak Bika, možete očekivati da će svi projekti ili veze koje započnete u prvom kvartalu godine imati dodatnu dozu ekspanzije sa ovim srećnim tranzitom.',
    Vaga: 'Vaga, nakon tolikog unutrašnjeg kopanja, čini se da ćete iskoristite 2023. da zaista pokažete svetu šta ste pronašli ispod svih tih taloga. Postoje neki stari obrasci koji možda nikada neće nestati, ali život je više u tome kako se nosite sa svojim okidačima i bolom nego u tome da ih uopšte nemate. Biće nekoliko prilika da produbite svoje odnose sa ljudima oko vas, ali ono što ćete možda otkriti je da, iako neko želi da raste sa vama, možda ste ga već prerasli.',
    Skorpija: 'Ove godine rizikujete kao nikada ranije, Škorpije. Mnogi od vas će videti da se neki od ovih rizika isplati kada konačno preduzmete akciju i uklonite preterano analitičko razmišljanje. Stres i uznemirenost nisu preduslovi za vaš kreativni proces. Kada je posao u pitanju, bićete napredniji i mnogi drugi će to primetiti. Ne zaboravite da se zahvalite pravim ljudima i delite bogatstvo kada možete.',
    Strelac: 'Strelčevi, nakon što ste jedva preživeli prethodnu godinu, konačno dolazi predah koji vam je nedostajao. Sa toliko veze i isprepletenosti sa vašim prošlim bolom, konačno ste u mogućnosti da ga se i oslobodite. Postajete dublje u kontaktu sa svojim emocijama i shvatate da teška osećanja nisu prepreka vašem rastu, oni su zapravo katalizator vaše krajnje sreće kada shvatite da niste vaše emocije, ali i da emocije izazivaju misli koje možete da menjate.',
    Jarac: 'Jarčevi, 2023. godina će vam doneti obilne poklone i trenutke u koje možete integrisati lekcije koje ste naučili. Čini se da je proteklih nekoliko godina bilo fokusirano na vašu samosvest i samopouzdanje, a sada ćete shvatiti koliko se ovaj unutrašnji rad isplatio. Za većinu vas biće romantičnih izgleda i potencijalnih prilik za posao samo da biste mogli da kažete „ne“ nečemu što je skoro potpuno da. Konačno ste se oslobodili mentaliteta nedostatka i počeli da shvatate da ljudi, mogućnosti i stvari koje prihvatate u svom životu moraju biti visokog kvaliteta. Imate pravo da kažete ne za sve ostalo i idete napred.',
    'Nepoznat znak': 'Ovo je tekst za nepoznat znak.',
  };

  
  

  return (
    <div>

      <div>
        <section className="cover-sec">
          <img src={lightBlueImage} className='covermuski' />
        </section>
        <main>
          <div className="main-section">
            <div className="container">
              <div className="main-section-data">
                <div className="row">
                  <div className="col-lg-3">
                    <div className="main-left-sidebar">
                      <div className="user_profile">
                        <div className="user-pro-img">
                          <div className="image-container">
                            {korisnik ? (
                              <div className="image-wrapper">
                                <img
                                    className="profilnaslika"
                                    src={korisnik.korisnikImage ? `http://localhost:5153/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/170x170"}
                                  />            
                              </div>
                            ) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                          </div>
                          

                        </div>
                        <div className="user_pro_status">
                          {/* <ul className="flw-hr">
                            <li><a href="#" title className="flww"><i className="la la-plus" /> Follow</a></li>
                            <li><a href="#" title className="hre">Hire</a></li>
                          </ul> */}
                          <div className="user-specs profilimeusername">
                            {korisnik ? <h3>{korisnik.ime} {korisnik.prezime}</h3> : <p>Korisnik nije dostupan</p>}
                            {korisnik ? <span>@{korisnik.korisnicko_Ime}</span> : <p>Username nije dostupan</p>}
                          </div>
                          <ul className="flw-status">
                            <li>
                              <span>Napravljenih</span>
                              <span className='drugispanprofil'>dogadjaja</span>
                              <b>{ukupnoElemenata}</b>
                            </li>
                            {/* <li>
                              <span>Ukupno</span>
                              <span className='drugispanprofil'>reakcija</span>
                              <b>BROJ</b>
                            </li> */}
                          </ul>
                        </div>{/*user_pro_status end*/}
                      </div>{/*user_profile end*/}

                    </div>{/*main-left-sidebar end*/}
                  </div>
                  <div className="col-lg-6">
                    <div className="main-ws-sec">
                      <div className="user-tab-sec">
                        {/* <h3>John Doe</h3>
                        <div className="star-descp">
                          <span>@johndoetheking</span>
                        </div>star-descp end */}
                        <div className="tab-feed">
                          <ul>
                            <li data-tab="feed-dd" className="active">
                              <a href="#" >
                                <img src="images/ic1.png" />
                                <span>Pregled dogadjaja</span>
                              </a>
                            </li>
                            <li data-tab="info-dd">
                              <a href="#" >
                                <img src="images/ic2.png" />
                                <span>Informacije</span>
                              </a>
                            </li>
                          </ul>
                        </div>{/* tab-feed end*/}
                      </div>{/*user-tab-sec end*/}
                      <div className="product-feed-tab current" id="feed-dd">
                        <div className="posts-section">
                          {dogadjaji.map((dogadjaj,index) => (
                            <div key={dogadjaj.id} className="post-bar">
                              <div className="post-bar">
                                <div className="post_topbar">
                                  <div className="usy-dt">
                                   
                                  <img
                                    className="profilnaslikaobjava"
                                    src={korisnik.korisnikImage ? `http://localhost:5153/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/50x50"}/>
                                 
                                    <div className="usy-name">
                                      {korisnik ? <h3>{korisnik.ime} {korisnik.prezime}</h3> : <p>Korisnik nije dostupan</p>}
                                      <span><img src="images/clock.png" />{dogadjaj.formattedDatum}</span>
                                    </div>
                                  </div>                    
                                </div>
                                <div className="job_descp">
                                  <h3>{dogadjaj.naslov}</h3>
                                  <ul className="job-dt">
                                    <li><a href="#" >Zurka</a></li>
                                    <li><span>20.05.2023. od 21:00</span></li>
                                  </ul>
                                  <p>{dogadjaj.opis}</p>
                                  {/* images/izletiste.jpg */}
                                  {dogadjaj.dogadjajImage && (
                                    <img src={`http://localhost:5153/resources/${dogadjaj.dogadjajImage}`} className="rounded float-left dogadjaj-slika" />
                                  )}
                                  {/* https://localhost:5153/resources/${dogadjaj.dogadjajImage} */}
                                  {/* MAPA POCETAK */}
                                  <HideShowMapa
                                    latitude={dogadjaj.x}
                                    longitude={dogadjaj.y}
                                  />
                                  {/* MAPA KRAJ */}
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
                                </div>

                              </div>{/*post-bar end*/}
                            </div>
                          ))}
                          <div className="load-more">
                            {ukupnoElemenata > brojPosiljke * 3 && (
                              <button className='ucitajjosdogadjaja' onClick={() => UcitajDalje()}>Ucitaj jos događaja</button>
                            )}
                          </div>

                        </div>{/*posts-section end*/}
                      </div>{/*product-feed-tab end*/}
                      <div className="product-feed-tab" id="info-dd">
                        <div className="user-profile-ov">
                          <h3>Rezime</h3>
                          {korisnik ? <p>Ja sam {korisnik.ime} {korisnik.prezime}, na internetu poznatiji kao {korisnik.korisnicko_Ime}. Rodjen sam {mojdatum}. Moja mail adresa je {korisnik.email_Adresa}. Ne ustrucavajte se da me kontaktirate. Ja sam jedna pozitivna osoba zeljna druzenja. Hajde da se zabavimo!</p> : <p>Korisnik nije dostupan</p>}
                        </div>{/*user-profile-ov end*/}
                      </div>{/*product-feed-tab end*/}
                      <div className="product-feed-tab" id="portfolio-dd">
                        <div className="portfolio-gallery-sec">
                          <h3>Portfolio</h3>
                        </div>{/*portfolio-gallery-sec end*/}
                      </div>{/*product-feed-tab end*/}
                    </div>{/*main-ws-sec end*/}
                  </div>
                  <div className="col-lg-3">
                    <div className="right-sidebar">
                      <div className="widget widget-portfolio">
                        <div className="wd-heady">
                          <h3>Moj horoskop</h3>
                          {korisnik ? <span className='horoskop'>{odrediHoroskopskiZnak(mojdatum)}</span> : <p>Korisnik nije dostupan</p>}
                          <span>S obzirom na to da 2023. godina počinje sa srećnim Jupiterom u vašem znaku (do maja), iskoristite prvi kvartal 2023. da rizikujete i videćete rezultate. To znači da se u smislu ljubavi, stila života i karijere od vas traži da izađete iz svoje zone komfora i vizualizujete život koji želite umesto da zaostajete sa životom koji imate. To ne znači da se ne treba da budete zahvalni na sadašnjem trenutku, ali to znači da ćete biti primorani da razmišljate van okvira i idete za onim što želite.</span>

                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main >
        <footer>
          <div className="footy-sec mn no-margin">
            <div className="container">
              <ul>
                <li><a href="#" >Help Center</a></li>
                <li><a href="#" >Privacy Policy</a></li>
                <li><a href="#" >Community Guidelines</a></li>
                <li><a href="#" >Cookies Policy</a></li>
                <li><a href="#" >Career</a></li>
                <li><a href="#" >Forum</a></li>
                <li><a href="#" >Language</a></li>
                <li><a href="#" >Copyright Policy</a></li>
              </ul>
              <p><img src="images/copy-icon2.png" />Copyright 2023</p>
              <img className="fl-rgt slikafooter" src="images/eb-logo-dugi2.png" />
            </div>
          </div>
        </footer>{/*footer end*/}
        {/*theme-layout end*/}
      </div >
    </div >
  )
}

export default ProfilTudjiKomponenta