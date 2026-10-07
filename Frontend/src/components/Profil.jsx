import { api, API_BASE } from '../api';
import React from 'react'
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import { useAuth } from '../auth';
import { useNotifications } from '../notifications';
import DogadjajKartica from './DogadjajKartica';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import { jeZavrsen } from '../utils/dogadjaj';


function Profil() {
  const { id: routeId } = useParams();      // definisan samo na /profilkorisnika/:id
  const { userId } = useAuth();             // ulogovani korisnik
  const { ucitajNotifikacije } = useNotifications();
  const navigate = useNavigate();
  const profileId = routeId || userId;      // koji profil gledamo
  const isOwnProfile = String(profileId) === String(userId);

  const [profileTab, setProfileTab] = useState('feed-dd'); // 'feed-dd' | 'info-dd'
  const [statusFilter, setStatusFilter] = useState('svi'); // 'svi' | 'predstojeci' | 'zavrseni'

  // Dogadjaji profila se ucitavaju 3 po 3 kako korisnik skroluje (vidi useBeskonacnaLista)
  const lista = useBeskonacnaLista(
    profileId ? `/Korisnik/VratiDogadjajeKorisnika/${profileId}` : null,
    { mapiraj: (d) => ({ ...d, formattedDatum: moment(d.datum_Objave).format("DD.MM.YYYY") }) }
  );
  const dogadjaji = lista.stavke;
  const ukupnoElemenata = lista.ukupno ?? 0;
  const [korisnik, setKorisnik] = useState(null);       // ciji profil gledamo
  const [ulogovani, setUlogovani] = useState(null);     // ko gleda (treba kartici)
  const [mojdatum, setmojdatum] = useState();
  const [kategorije, setKategorije] = useState(null);   // [{ kategorija, broj }] - svi dogadjaji korisnika

  const [meniSlikeOtvoren, setMeniSlikeOtvoren] = useState(false);
  const [slikaSeMenja, setSlikaSeMenja] = useState(false);
  const fileInputRef = useRef(null);
  const avatarRef = useRef(null);

  // Meni za profilnu sliku: klik van njega ili ESC zatvara
  useEffect(() => {
    const onClick = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setMeniSlikeOtvoren(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setMeniSlikeOtvoren(false); };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Header drzi svoju kopiju korisnika - javi mu da osvezi avatar
  const javiHeaderu = () => window.dispatchEvent(new Event('korisnik-azuriran'));

  // Menjanje slike ima smisla samo na svom profilu - dugme koje ovo zove je
  // vec sakriveno kad !isOwnProfile.
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // da isti fajl moze ponovo da se izabere
    if (!file) return;
    setMeniSlikeOtvoren(false);
    setSlikaSeMenja(true);
    try {
      const formData = new FormData();
      formData.append('fajl', file);
      const status = await api.post(`/Korisnik/DodajSlikuKorisniku?id_korisnika=${userId}`, formData);
      if (status.statusCode === 1) {
        setKorisnik((k) => ({ ...k, korisnikImage: status.message }));
        javiHeaderu();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSlikaSeMenja(false);
    }
  };

  // BRISANJE SLIKE KORISNIKU (samo svoj profil)
  const handleDeleteImage = async () => {
    setMeniSlikeOtvoren(false);
    if (!window.confirm('Da li sigurno zelis da uklonis profilnu sliku?')) return;
    setSlikaSeMenja(true);
    try {
      await api.del(`/Korisnik/IzbrisiSlikuKorisnika/${userId}`);
      setKorisnik((k) => ({ ...k, korisnikImage: null }));
      javiHeaderu();
    } catch (error) {
      console.log("GRESKA PRILIKOM BRISANJA SLIKE", error);
    } finally {
      setSlikaSeMenja(false);
    }
  };

  useEffect(() => {
    ucitajKorisnika();
  }, [profileId]); // ponovo ucitaj kad se promeni profil

  useEffect(() => {
    // credentials: backend Validiraj() cita token iz kolacica
    api.get(`/Korisnik/VratiKategorijeKorisnika/${profileId}`, { credentials: 'include' })
      .then(setKategorije)
      .catch((error) => console.log("kategorije:", error));
  }, [profileId]);

  // Kartica dogadjaja treba ulogovanog korisnika (vlasnik? slika za komentare)
  useEffect(() => {
    if (isOwnProfile) return;
    api.get(`/Korisnik/VratiKorisnika_ID/${userId}`)
      .then(setUlogovani)
      .catch((error) => console.log(error));
  }, [userId, isOwnProfile]);
  const ulogovaniKorisnik = isOwnProfile ? korisnik : ulogovani;

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

  // BRISANJE OBJAVE (samo svoj profil - dugme skriveno inace)
  const obrisiObjavu = async (id) => {
    try {
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${id}`);
      lista.setStavke(prevDogadjaji => prevDogadjaji.filter(dogadjaj => dogadjaj.id !== id));
      lista.setUkupno(n => (n ?? 1) - 1);
      ucitajNotifikacije(); // backend je obrisao i notifikacije tog dogadjaja
    } catch (error) {
      console.log('Doslo je do greske prilikom brisanja objave:', error);
    }
  };

  const ukupnoKategorija = kategorije ? kategorije.reduce((zbir, k) => zbir + k.broj, 0) : 0;

  const prikazani = dogadjaji.filter((d) => {
    if (statusFilter === 'svi') return true;
    return statusFilter === 'zavrseni' ? jeZavrsen(d) : !jeZavrsen(d);
  });

  const avatarSrc = korisnik?.korisnikImage
    ? `${API_BASE}/resources/${korisnik.korisnikImage}`
    : "http://via.placeholder.com/170x170";

  const FILTERI = [
    ['svi', 'Svi'],
    ['predstojeci', 'Predstojeci'],
    ['zavrseni', 'Zavrseni'],
  ];

  const INFO_REDOVI = korisnik ? [
    ['la-user', 'Ime i prezime', `${korisnik.ime} ${korisnik.prezime}`],
    ['la-at', 'Korisnicko ime', `@${korisnik.korisnicko_Ime}`],
    ['la-birthday-cake', 'Datum rodjenja', mojdatum],
    ['la-envelope', 'Email', korisnik.email_Adresa],
  ] : [];

  return (
    <div>
      <section className="profil-cover" />
      <main>
        <div className="container">
          <div className="row">

            <div className="col-lg-3">
              <aside className="profil-card">
                <div className="profil-avatar" ref={avatarRef}>
                  {korisnik ? (
                    <img className="profil-avatar-img" src={avatarSrc} alt="" />
                  ) : (
                    <div className="profil-avatar-img profil-skeleton" />
                  )}
                  {slikaSeMenja && <div className="profil-avatar-loading"><i className="la la-hourglass-half" /></div>}

                  {isOwnProfile && korisnik && (
                    <>
                      <button
                        type="button"
                        className="profil-avatar-edit"
                        onClick={() => setMeniSlikeOtvoren((v) => !v)}
                        aria-label="Promeni profilnu sliku"
                        aria-haspopup="menu"
                        aria-expanded={meniSlikeOtvoren}
                      >
                        <i className="la la-camera" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        hidden
                      />
                      {meniSlikeOtvoren && (
                        <div className="profil-avatar-menu" role="menu">
                          <button type="button" role="menuitem" onClick={() => fileInputRef.current.click()}>
                            <i className="la la-image" /> {korisnik.korisnikImage ? 'Promeni sliku' : 'Dodaj sliku'}
                          </button>
                          {korisnik.korisnikImage && (
                            <button type="button" role="menuitem" className="is-danger" onClick={handleDeleteImage}>
                              <i className="la la-trash" /> Ukloni sliku
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {korisnik ? (
                  <>
                    <h2 className="profil-name">{korisnik.ime} {korisnik.prezime}</h2>
                    <span className="profil-username">@{korisnik.korisnicko_Ime}</span>
                  </>
                ) : (
                  <>
                    <div className="profil-skeleton profil-skeleton-line" />
                    <div className="profil-skeleton profil-skeleton-line profil-skeleton-short" />
                  </>
                )}

                {!isOwnProfile && korisnik && (
                  <Link to={`/chat?korisnik=${korisnik.id}`} className="profil-message-btn">
                    <i className="la la-envelope" /> Posalji poruku
                  </Link>
                )}

                <div className="profil-stat">
                  <b>{ukupnoElemenata}</b>
                  <span>Napravljenih dogadjaja</span>
                </div>
              </aside>
            </div>

            <div className="col-lg-6">
              <div className="profil-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'feed-dd'}
                  className={`profil-tab ${profileTab === 'feed-dd' ? 'is-active' : ''}`}
                  onClick={() => setProfileTab('feed-dd')}
                >
                  <i className="la la-calendar" /> Dogadjaji
                  <span className="profil-tab-count">{ukupnoElemenata}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={profileTab === 'info-dd'}
                  className={`profil-tab ${profileTab === 'info-dd' ? 'is-active' : ''}`}
                  onClick={() => setProfileTab('info-dd')}
                >
                  <i className="la la-user" /> Informacije
                </button>
              </div>

              {profileTab === 'feed-dd' && (
                <div>
                  <div className="profil-chips">
                    {FILTERI.map(([vrednost, naziv]) => (
                      <button
                        key={vrednost}
                        type="button"
                        className={`profil-chip ${statusFilter === vrednost ? 'is-active' : ''}`}
                        onClick={() => setStatusFilter(vrednost)}
                      >
                        {naziv}
                      </button>
                    ))}
                  </div>

                  {lista.pocetno || !ulogovaniKorisnik ? (
                    <div className="profil-skeleton profil-skeleton-card" />
                  ) : prikazani.length === 0 ? (
                    <div className="profil-empty">Nema dogadjaja za prikaz.</div>
                  ) : (
                    prikazani.map((dogadjaj) => (
                      <DogadjajKartica
                        key={dogadjaj.id}
                        dogadjaj={{ ...dogadjaj, slikaKorisnika: korisnik?.korisnikImage }}
                        korisnik={ulogovaniKorisnik}
                        onOpen={(d) => navigate(`/objava/${d.id}`)}
                        onObrisi={obrisiObjavu}
                      />
                    ))
                  )}

                  <KrajListe lista={lista} />
                </div>
              )}

              {profileTab === 'info-dd' && (
                <div className="profil-info">
                  {INFO_REDOVI.length === 0 ? (
                    <div className="profil-skeleton profil-skeleton-card" />
                  ) : (
                    INFO_REDOVI.map(([ikona, naziv, vrednost]) => (
                      <div className="profil-info-row" key={naziv}>
                        <span className="profil-info-icon"><i className={`la ${ikona}`} /></span>
                        <div>
                          <small>{naziv}</small>
                          <strong>{vrednost}</strong>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="col-lg-3">
              <aside className="profil-side-card">
                <h3><i className="la la-heart" /> Omiljene kategorije</h3>
                {kategorije === null ? (
                  <div className="profil-skeleton profil-skeleton-line" />
                ) : kategorije.length === 0 ? (
                  <p className="profil-side-empty">Jos nema dogadjaja.</p>
                ) : (
                  <ul className="profil-kategorije">
                    {kategorije.slice(0, 5).map((k) => {
                      const procenat = Math.round((k.broj / ukupnoKategorija) * 100);
                      return (
                        <li key={k.kategorija}>
                          <div className="profil-kategorija-info">
                            <span>{k.kategorija}</span>
                            <b>{k.broj} <small>({procenat}%)</small></b>
                          </div>
                          <div className="profil-kategorija-bar">
                            <div style={{ width: `${procenat}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </aside>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default Profil
