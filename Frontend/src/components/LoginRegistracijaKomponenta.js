
import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

function LoginRegistracijaKomponenta() {

  
  const [activeTab, setActiveTab] = useState('tab-1'); // Podrazumevano aktivan tab je "Prijava"

  const handleClick = (tabId) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    Cookies.remove('token');
    Cookies.remove('userID');
  }, []);
  

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  
  const handleSubmit1 = (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = 'Polje je obavezno.';
      }
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const username = poljaForme.username.value;
    const password = poljaForme.password.value;


    console.log("PRVA PROVERA");
    fetch(`http://localhost:5153/Korisnik/LogovanjeKorisnik/${username}/${password}`)
        .then(res => {
          if (res.status === 401){
            navigate('/')
          }
          return res.json();
        })
        .then(data => {
            if(data.nema !== undefined)
            {
              console.log(data);
              probajAdmin();
              console.log("NEMA PODACI ZA KORISNIKA")
            }
            else if(data.blokiran !== undefined)
            {
              alert("Vas nalog je blokiran");
            }
            else
            {
              console.log("ULOGOVANJE USPENSO")
              Cookies.set(`token`, `${data.token}`, { path: '/' });
              Cookies.set(`userID`, `${data.userID}`, { path: '/' }); 
              navigate('/pocetna');
            }
        })

        console.log("SLEDECE JE PROBA ADMINA")
    const probajAdmin = () => {
      fetch(`http://localhost:5153/Administrator/LogovanjeAdministrator/${username}/${password}`,
      {
        method: 'GET',
      })
        .then(res => res.json())
        .then(data => {
          console.log("care");
            if(data.nema !== undefined)
            {
              console.log("NEMA NI ADMIN BRT")
              alert("Pogresan unos!");
            }
            else
            {
              navigate('/admin');
            }
        })
    }
    console.log("KRAJ OBA FETCHA")
}; //ZAVRSAVA ES FUNCIJA SUBMIT!!!!!!!!!!!!!!!!
// -----------------------------------------------------------------------------------------------
    
  
  const handleSubmit2 = (e) => {
    e.preventDefault();
    const poljaForme = e.target.elements;
    let isGreska = false;
    const noveGreske = {};

    for (let i = 0; i < poljaForme.length; i++) {
      const field = poljaForme[i];

      if (field.value.trim() === '') {
        isGreska = true;
        noveGreske[field.name] = 'Polje je obavezno.';
      }
    }

    if (isGreska) {
      setErrors(noveGreske);
      return;
    }

    const ime = poljaForme.ime.value;
    const prezime = poljaForme.prezime.value;
    const korisnickoime = poljaForme.username1.value;
    const mail = encodeURIComponent(poljaForme.email.value);
    const datumrodjenja = poljaForme.date.value;
    const lozinka = poljaForme.password.value;
    console.log("PREDFETCH")
    console.log(datumrodjenja)
    const url = `http://localhost:5153/Korisnik/DodajKorisnika/${ime}/${prezime}/${korisnickoime}/${lozinka}/${datumrodjenja}/${mail}`;
    console.log(url);
    fetch(url, {
      method: 'POST',
    })
      .then(response => {
        if (response.ok) {
          console.log(response);
          alert("Uspesno ste registrovani!");
          window.location.reload();
          return response;
          
        } else {
          throw new Error('Došlo je do greške prilikom registracije.');
        }
      })
      .then(data => {
        console.log('Korisnik je uspešno registrovan:', data);
        // Dodajte odgovarajuće postupanje nakon registracije
      })
      .catch(error => {
        console.error('Greska:', error);
        // Dodajte odgovarajuće postupanje u slučaju greške
      });
      console.log("POSTFETCH")

  }; //ZAVRSAVA SE FUNCIJA SUBMIT2!!!!!!!!!!!!!!!!

  
  
  return (
    <div>
      <div className="sign-in-page">
        <div className="signin-popup">
          <div className="signin-pop">
            <div className="row">
              <div className="col-lg-6">
                <div className="cmp-info">
                  <div className="cm-logo">
                  <img className='logozalogin' src="images/eb-logo-dugi2.png" />
                    <p>Eventbox je inovativna društvena mreža koja predstavlja jedinstveno mesto za povezivanje ljudi koji žele da organizuju i učestvuju u raznovrsnim događajima.</p>
                  </div>{/*cm-logo end*/}
                  <img src="images/cm-main-img.png" />
                </div>{/*cmp-info end*/}
              </div>
              <div className="col-lg-6">
                <div className="login-sec">
                <ul className="sign-control">
                <li 
                  data-tab="tab-1" 
                  className={activeTab === 'tab-1' ? 'current' : ''} 
                  onClick={() => handleClick('tab-1')}
                >
                  <a href="#">Prijava</a>
                </li>
                <li 
                  data-tab="tab-2" 
                  className={activeTab === 'tab-2' ? 'current' : ''} 
                  onClick={() => handleClick('tab-2')}
                >
                  <a href="#">Registracija</a>
                </li>
              </ul>
                  <div 
                    className={`sign_in_sec ${activeTab === 'tab-1' ? 'current animated fadeIn' : ''}`} 
                    id="tab-1"
                  >
                    <h3>Prijava</h3>
                    <form onSubmit={handleSubmit1}>
                      <div className="row">
                        <div className="col-lg-12 no-pdd">
                          <div className="sn-field">                     
                            <input type="text" name="username" placeholder="Korisnicko ime" autoComplete='off'/>
                            <i className="la la-at" />
                          </div>{/*sn-field end*/}
                          {errors.username && <span className="error-message">{errors.username}</span>}
                        </div>
                        <div className="col-lg-12 no-pdd">
                          <div className="sn-field">
                            <input type="password" name="password" placeholder="Password" />
                            <i className="la la-lock" />
                          </div>
                          {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        
                        <div className="col-lg-12 no-pdd">
                          <button type="submit" value="submit">Prijava</button> 
                        </div>
                        
                      </div>
                    </form>
                  </div>{/*sign_in_sec end*/}
                  <div 
                    className={`sign_in_sec ${activeTab === 'tab-2' ? 'current animated fadeIn' : ''}`} 
                    id="tab-2"
                  >
                    
                    <div className="dff-tab current" id="tab-3">
                      <form onSubmit={handleSubmit2}>
                        <div className="row">
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="text" name="ime" placeholder="Ime" autoComplete='off'/>
                              <i className="la la-user" />
                            </div>
                            {errors.ime && <span className="error-message">{errors.ime}</span>}
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="text" name="prezime" placeholder="Prezime" autoComplete='off'/>
                              <i className="la la-user" />
                            </div>
                            {errors.prezime && <span className="error-message">{errors.prezime}</span>}
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="text" name="username1" placeholder="Korisnicko ime" autoComplete='off'/>
                              <i className="la la-at" />
                            </div>
                            {errors.username1 && <span className="error-message">{errors.username1}</span>}
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="email" name="email" placeholder="Mail adresa" autoComplete='off'/>
                              <i className="la la-mail-forward
                                " />  
                            </div>
                            {errors.email && <span className="error-message">{errors.email}</span>}
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="date" name="date" placeholder="Datum rodjenja" autoComplete='off'/>
                              <i className="la la-calendar"/>              
                            </div>
                            {errors.date && <span className="error-message">{errors.date}</span>}
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="password" name="password" placeholder="Lozinka" />
                              <i className="la la-lock" />
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                          </div>
                          {/* <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="password" name="repeat-password" placeholder="Ponovi lozinku" />
                              <i className="la la-lock" />
                            </div>
                          </div> */}
                          
                          <div className="col-lg-12 no-pdd">
                            <button type="submit" value="submit">Registruj se</button>
                          </div>
                        </div>
                      </form>
                    </div>{/*dff-tab end*/}
                    <div className="dff-tab" id="tab-4">
                      <form>
                        <div className="row">
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="text" name="company-name" placeholder="Company Name" />
                              <i className="la la-building" />
                            </div>
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="text" name="country" placeholder="Country" />
                              <i className="la la-globe" />
                            </div>
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="password" name="password" placeholder="Password" />
                              <i className="la la-lock" />
                            </div>
                          </div>
                          <div className="col-lg-12 no-pdd">
                            <div className="sn-field">
                              <input type="password" name="repeat-password" placeholder="Repeat Password" />
                              <i className="la la-lock" />
                            </div>
                          </div>      
                          <div className="col-lg-12 no-pdd">
                            <button type="submit" value="submit">Get Started</button>
                          </div>
                        </div>
                      </form>
                    </div>{/*dff-tab end*/}
                  </div>
                </div>{/*login-sec end*/}
              </div>
            </div>
          </div>{/*signin-pop end*/}
        </div>{/*signin-popup end*/}
        <div className="footy-sec">
          <div className="container">
            {/* <ul>
              <li><a href="#" >Help Center</a></li>
              <li><a href="#" >Privacy Policy</a></li>
              <li><a href="#" >Community Guidelines</a></li>
              <li><a href="#" >Cookies Policy</a></li>
              <li><a href="#" >Career</a></li>
              <li><a href="#" >Forum</a></li>
              <li><a href="#" >Language</a></li>
              <li><a href="#" >Copyright Policy</a></li>
            </ul> */}
            <p><img src="images/copy-icon.png" />Copyright 2023</p>
          </div>
        </div>{/*footy-sec end*/}
      </div>{/*sign-in-page end*/}
      {/*theme-layout end*/}

    </div>
  )
 
  
}


export default LoginRegistracijaKomponenta;