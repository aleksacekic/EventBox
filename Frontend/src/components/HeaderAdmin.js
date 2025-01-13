import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

function HeaderAdmin() {
 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [korisnik, setKorisnik] = useState(null);
  const [mojdatum, setmojdatum] = useState();

  const [isActive, setIsActive] = useState(false);

  const toggleActive = () => {
    setIsActive(!isActive);
  };



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



  const formatirajDatum = (datum) => {
    return moment(datum).format('DD.MM.YYYY');
  };
  

  return (
    <div>
      <header>
        <div className="container">
          <div className="header-data">
            <div className="logo">
            <a href="index.html"><img src="images/logosajt(4).ico" /></a>
            </div>                
            <div className="user-account">
              
                <>
                  <div className="user-info">
                    <img
                      className="profilnaslikaheader"
                      src={"http://via.placeholder.com/50x50"}
                    />
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
             
            </div>
          </div>
        </div>
      </header>


    </div>
  );
}

export default HeaderAdmin;
