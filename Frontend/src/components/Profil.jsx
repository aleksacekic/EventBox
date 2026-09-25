import { api, API_BASE } from '../api';
import React from 'react'
import lightBlueImage from '../lightblue.jpg';
import HideShowMapa from './Hide&ShowMapa';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import moment from 'moment';
import { BsCamera } from 'react-icons/bs';
import { Button } from 'react-bootstrap';
import { useAuth } from '../auth';


function Profil() {
  const { id: routeId } = useParams();      // definisan samo na /profilkorisnika/:id
  const { userId } = useAuth();             // ulogovani korisnik
  const profileId = routeId || userId;      // koji profil gledamo
  const isOwnProfile = String(profileId) === String(userId);

  const [activeIndex, setActiveIndex] = useState(null);
  const toggleOptions = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null); // Zatvori opciju ako je već otvorena
    } else {
      setActiveIndex(index); // Otvori opciju
    }
  };

  // [Faza 1] tab-feed prebacen na React state (feed-dd / info-dd).
  const [profileTab, setProfileTab] = useState('feed-dd');

  const [dogadjaji, setDogadjaji] = useState([]);
  const [brojPosiljke, setBrojPosiljke] = useState(1);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // za dodavanje slike

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    setSelectedImage(file);
  };

  useEffect(() => {
    if (selectedImage) {
      dodajSlikuKorisniku();
    }
  }, [selectedImage]);

  // Menjanje slike ima smisla samo na svom profilu - dugme koje ovo zove je
  // vec sakriveno kad !isOwnProfile, ali profileId===userId ovde svakako vazi.
  const dodajSlikuKorisniku = async () => {
    try {
      const formData = new FormData();
      formData.append('fajl', selectedImage);
      await api.post(`/Korisnik/DodajSlikuKorisniku?id_korisnika=${userId}`, formData);
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const handleCameraIconClick = () => {
    setShowOptions(!showOptions);
  };

  useEffect(() => {
    ucitajDogadjaje();
  }, [brojPosiljke, profileId]); // ponovo ucitaj kad se promeni profil

  const UcitajDalje = () => {
    setBrojPosiljke(prevBrojPosiljke => prevBrojPosiljke + 1);
  }

  const ucitajDogadjaje = async () => {
    try {
      // 401 -> api klijent sam vraca na /login
      const data = await api.get(
        `/Korisnik/VratiDogadjajeKorisnika/${profileId}/${brojPosiljke}/${ukupnoElemenata}`,
        { credentials: 'include' }
      );
      if (data.kraj === undefined) {
        const mapirani = data.dogadjaji.map(d => ({
          ...d,
          formattedDatum: moment(d.datum_Objave).format("DD.MM.YYYY"),
        }));
        setDogadjaji(prev => (brojPosiljke === 1 ? mapirani : [...prev, ...mapirani]));
        setUkupnoElemenata(data.ukupno_elemenata);
      }
    } catch (error) {
      console.log("ucitajDogadjaje:", error);
    }
  };

  // BRISANJE SLIKE KORISNIKU (samo svoj profil)
  const handleDeleteImage = async () => {
    try {
      await api.del(`/Korisnik/IzbrisiSlikuKorisnika/${userId}`);
      window.location.reload();
    } catch (error) {
      console.log("GRESKA PRILIKOM BRISANJA SLIKE", error);
    }
  };

  useEffect(() => {
    ucitajKorisnika();
  }, [profileId]); // ponovo ucitaj kad se promeni profil

  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };

  const ucitajKorisnika = async () => {
    try {
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${profileId}`);
      const formatiranDatum = formatirajDatum(data.datum_rodjenja);
      data.datumrodjenja = formatiranDatum;
      setKorisnik(data);
      setmojdatum(formatiranDatum);
    } catch (error) {
      console.log(error);
    }
  };

  const odrediHoroskopskiZnak = (datum) => {
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

  // BRISANJE OBJAVE (samo svoj profil - dugme skriveno inace)
  const obrisiObjavu = async (id) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${id}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
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
                                    src={korisnik.korisnikImage ? `${API_BASE}/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/170x170"}
                                  />
                                {isOwnProfile && (
                                  <Button variant="light" className="camera-icon" onClick={handleCameraIconClick}>
                                    <BsCamera />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p>Korisnik nije dostupan</p>
                            )}
                          </div>

                          {isOwnProfile && showOptions && (
                          <div className="options">
                            {korisnik?.korisnikImage && (
                              <div className="option" onClick={handleDeleteImage}>
                                Izbrisi sliku
                              </div>
                            )}
                            <div className="option" onClick={() => {
                               document.querySelector('input[type="file"]').click();
                             }}>
                               <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                               Dodaj sliku
                             </div>
                          </div>
                        )}

                        </div>
                        <div className="user_pro_status">
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
                          </ul>
                        </div>{/*user_pro_status end*/}
                      </div>{/*user_profile end*/}

                    </div>{/*main-left-sidebar end*/}
                  </div>
                  <div className="col-lg-6">
                    <div className="main-ws-sec">
                      <div className="user-tab-sec">
                        <div className="tab-feed">
                          <ul>
                            <li
                              className={profileTab === 'feed-dd' ? 'active' : ''}
                              onClick={() => setProfileTab('feed-dd')}
                            >
                              <a>
                                <img src="images/ic1.png" />
                                <span>Pregled dogadjaja</span>
                              </a>
                            </li>
                            <li
                              className={profileTab === 'info-dd' ? 'active' : ''}
                              onClick={() => setProfileTab('info-dd')}
                            >
                              <a>
                                <img src="images/ic2.png" />
                                <span>Informacije</span>
                              </a>
                            </li>
                          </ul>
                        </div>{/* tab-feed end*/}
                      </div>{/*user-tab-sec end*/}
                      <div className={`product-feed-tab ${profileTab === 'feed-dd' ? 'current' : ''}`} id="feed-dd">
                        <div className="posts-section">
                          {dogadjaji.map((dogadjaj,index) => (
                            <div key={dogadjaj.id} className="post-bar">
                              <div className="post-bar">
                                <div className="post_topbar">
                                  <div className="usy-dt">

                                  {korisnik ? <img
                                    className="profilnaslikaobjava"
                                    src={korisnik.korisnikImage ? `${API_BASE}/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/50x50"}/> : <p>Korisnik nije dostupan</p>}

                                    <div className="usy-name">
                                      {korisnik ? <h3>{korisnik.ime} {korisnik.prezime}</h3> : <p>Korisnik nije dostupan</p>}
                                      <span><img src="images/clock.png" />{dogadjaj.formattedDatum}</span>
                                    </div>
                                  </div>
                                  {isOwnProfile && (
                                    <div className={`ed-opts ${activeIndex === index ? 'active' : ''}`}>
                                      <a className="ed-opts-open" onClick={() => toggleOptions(index)}><i className="la la-ellipsis-v" /></a>
                                      <ul className={`ed-options ${activeIndex === index ? 'active' : ''}`}>
                                        <li><a className='opcijeobjava' onClick={() => obrisiObjavu(dogadjaj.id)}>Obrisi objavu</a></li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                <div className="job_descp">
                                  <h3>{dogadjaj.naslov}</h3>
                                  <ul className="job-dt">
                                    <li><a href="#" >Zurka</a></li>
                                    <li><span>20.05.2023. od 21:00</span></li>
                                  </ul>
                                  <p>{dogadjaj.opis}</p>
                                  {dogadjaj.dogadjajImage && (
                                    <img src={`${API_BASE}/resources/${dogadjaj.dogadjajImage}`} className="rounded float-left dogadjaj-slika" />
                                  )}
                                  <HideShowMapa
                                    latitude={dogadjaj.x}
                                    longitude={dogadjaj.y}
                                  />
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
                      <div className={`product-feed-tab ${profileTab === 'info-dd' ? 'current' : ''}`} id="info-dd">
                        <div className="user-profile-ov">
                          <h3>Rezime</h3>
                          {korisnik ? <p>Ja sam {korisnik.ime} {korisnik.prezime}, na internetu poznatiji kao {korisnik.korisnicko_Ime}. Rodjen sam {mojdatum}. Moja mail adresa je {korisnik.email_Adresa}. Ne ustrucavajte se da me kontaktirate. Ja sam jedna pozitivna osoba zeljna druzenja. Hajde da se zabavimo!</p> : <p>Korisnik nije dostupan</p>}
                        </div>{/*user-profile-ov end*/}
                      </div>{/*product-feed-tab end*/}
                      <div className={`product-feed-tab ${profileTab === 'portfolio-dd' ? 'current' : ''}`} id="portfolio-dd">
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

        {/*theme-layout end*/}
      </div >
    </div >
  )
}

export default Profil
