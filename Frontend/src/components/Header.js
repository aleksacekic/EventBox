import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import Cookies from 'js-cookie'

import { useNavigate } from 'react-router-dom';

function Header() {
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();

  const [isActive, setIsActive] = useState(false);

  const navigate = useNavigate();

  const toggleActive = () => {
    setIsActive(!isActive);
  };



  const prosledi = (id) =>{
    const path = window.location.pathname;
    console.log(path);
    Cookies.set("tudjiID", id);
    if(path==="/profilkorisnika")
    {
      window.location.reload();
    }
    else{
      navigate('/profilkorisnika');
    }
    

    
  }


  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClickOutside = () => {
    setIsMenuOpen(false);
  };
  
  

  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef();

  function prikaziFormu() {
    var forma = document.querySelector('.notifikacije-forma');
    forma.style.display = 'flex';
  }

  

  async function handleSearchSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:5153/Korisnik/VratiKorisnikeSearch/${searchValue}`);
      const data = await response.json();
      console.log(response);
      console.log(data);
      if (data.kraj === 'KRAJ') {
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Greška prilikom pretrage:', error);
    }
  }

  function handleClickOutside(event) {
    if (searchRef.current && !searchRef.current.contains(event.target)) {
      setSearchResults([]);
    }
  }

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function searchUsers() {
      if (searchValue === '') {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5153/Korisnik/VratiKorisnikeSearch/${searchValue}`);
        const data = await response.json();
        if (data.kraj === 'KRAJ') {
          setSearchResults([]);
        } else {
          setSearchResults(data);
        }
      } catch (error) {
        console.error('Greška prilikom pretrage:', error);
      }
    }

    searchUsers();
  }, [searchValue]);

  useEffect(() => {
    ucitajKorisnika();
  }, []);

  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };
  
  const ucitajKorisnika = () => {
    const korisnik_Id = Cookies.get("userID");
    const url = `http://localhost:5153/Korisnik/VratiKorisnika_ID/${korisnik_Id}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        //console.log(data.datum_rodjenja);
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
  



  return (
    <div>
      <header>
        <div className="container">
          <div className="header-data">
            <div className="logo">
            <Link to="/pocetna"><a href="index.html"><img src="images/logosajt(4).ico" /></a></Link>
              
            </div>
            <div className="search-bar" ref={searchRef}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  name="search"
                  placeholder="Pretrazi korisnike..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoComplete="off"
                />
                <button type="submit"><i className="la la-search" /></button>
                {/* Prikaz rezultata pretrage */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                  <ul className="search-results-list">
                    {searchResults.map((result) => (
                      <li key={result.id} className="search-result-item">
                        <div className='search-podaci' onClick={() => {prosledi(result.id)}}>
                            <span className='prvispansearch'>@{result.korisnicko_Ime}</span>
                            <span>{result.ime} {result.prezime}</span> 
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                )}
              </form>
            </div>
            <nav className={isMenuOpen ? 'active' : ''} onClick={handleMenuClickOutside}>
              <h3 className="odeljcihamburgermenu" style={{ display: 'none' }}>Odeljci</h3>
              <ul>
                <li>
                  <a style={{ display: 'block' }}>
                    <span><img src="images/icon1.png" /></span>
                    <Link to="/pocetna">Pocetna</Link>
                  </a>
                </li>
                <li>
                  <a>
                    <span><img src="images/icon4.png" /></span>
                    <Link to="/profil">Profil</Link>
                  </a>
                </li>
                {/* <li>
                  <a href="#" className="not-box-open">
                    <span><img src="images/icon6.png" /></span>
                    Poruke
                  </a>
                </li> */}
                <li>
                  <a href="#" className="not-box-open notifikacije-u-hederu" onClick={prikaziFormu} style={{ display: 'none' }}>
                    <span><img src="images/icon7.png" /></span>
                    Notifikacije
                  </a>
                </li>
              </ul>
            </nav>
            <div className="menu-btn">
            <a href="#" onClick={handleMenuToggle}><i className="fa fa-bars" /></a>
            </div>
            <div className="user-account">
              {korisnik ? (
                <>
                  <div className="user-info">
                    <img
                      className="profilnaslikaheader"
                      src={korisnik.korisnikImage ? `http://localhost:5153/resources/${korisnik.korisnikImage}` : "http://via.placeholder.com/50x50"}
                    />
                    <a href="#">{korisnik.ime}</a>
                    <i className={`la la-sort-down ${isActive ? 'active' : ''}`} onClick={toggleActive} />
                  </div>
                  {isActive && (
                    <div className="user-account-settingss active">
                      {/* <h3>Podesavanja</h3>
                      <ul className="us-links">
                        <li><a href="profile-account-setting.html">Podesavanja profila</a></li>
                      </ul> */}
                      <h3 className="tc">
                        <Link to="/">
                          <a className='odjavise'>Odjavi se</a>
                        </Link>
                      </h3>
                    </div>
                  )}
                </>
              ) : (
                <p>Korisnik nije dostupan</p>
              )}
            </div>
          </div>
        </div>
      </header>


    </div>
  );
}

export default Header;
