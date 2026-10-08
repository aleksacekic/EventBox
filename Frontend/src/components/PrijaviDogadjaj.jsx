import { api, API_BASE } from '../api';
import React from 'react'
import HideShowMapa from './Hide&ShowMapa';
import Razlog from './Razlog';
import { toast } from 'react-toastify';
import KrajListe from './KrajListe';
import { useBeskonacnaLista } from '../useBeskonacnaLista';

function Pr_Dog() {

  function otvoriDiv(event, id) {
    event.preventDefault(); 
    var div = document.getElementById(id);
          if (div.style.display === "none") {
              div.style.display = "block";
          } 
          else {
              div.style.display = "none";
          }
  }


  // Blokiranje kreatora: odmah gubi pristup (server mu ponistava sesiju); odblokira se u tabu
  // "Blokirani korisnici". Obe akcije traze potvrdu - jedan pogresan klik ne sme da ih pokrene.
  const BlokirajFunc = async (e, kreatorId, korisnickoIme) => {
    e.preventDefault();
    if (!window.confirm(`Blokirati korisnika @${korisnickoIme}? Odmah ce biti odjavljen i nece moci da se prijavi.`)) return;
    try {
      await api.put(`/Korisnik/BlokirajKorisnika/${kreatorId}`);
      toast.success(`Korisnik @${korisnickoIme} je blokiran.`);
    } catch (error) {
      console.error('Blokiranje nije uspelo:', error);
      toast.error('Blokiranje nije uspelo. Pokusajte ponovo.');
    }
  }

  const ObrisiFunc = async (e, ID_PR, ID_DOG, naslov) => {
    e.preventDefault();
    if (!window.confirm(`Trajno obrisati dogadjaj "${naslov}"?`)) return;
    try {
      // Brisanje dogadjaja kaskadno brise i njegovu prijavu sa razlozima
      await api.del(`/Dogadjaj/IzbrisiDogadjaj/${ID_DOG}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(d => d.id !== ID_PR))
      toast.success("Dogadjaj je obrisan.");
    } catch (error) {
      console.error('Brisanje nije uspelo:', error);
      toast.error('Brisanje nije uspelo. Pokusajte ponovo.');
    }
  }

  const IgnorisiFunc = async (e, ID_PR) => {
    e.preventDefault();
    try {
      // Razlozi se brisu kaskadno zajedno sa prijavom
      await api.del(`/Pr_dog/IzbrisiPrijavljeniDogadjaj/${ID_PR}`);
      setDogadjaji(prevDogadjaji => prevDogadjaji.filter(d => d.id !== ID_PR))
      toast.success("Prijava je odbacena.");
    } catch (error) {
      console.error('Odbacivanje nije uspelo:', error);
      toast.error('Odbacivanje nije uspelo. Pokusajte ponovo.');
    }
  }

    // Prijave se ucitavaju 4 po 4 kako admin skroluje (vidi useBeskonacnaLista)
    const lista = useBeskonacnaLista('/Pr_dog/VratiPrijavljene_dog', { limit: 4 });
    const dogadjaji = lista.stavke;
    const setDogadjaji = lista.setStavke;

    return (
      <div className='pr_dog_klasa' onClick={(e) => { e.stopPropagation(); }}>
        <div className='job_descp2'>
          <h2 className="prijavljeniadminutext">PRIJAVLJENI DOGAĐAJI</h2>
        </div>
        {dogadjaji.map(dogadjaj => (
          <div className="post-bar" key={dogadjaj.dogadjaj_Id.id}>
            <div className="post_topbar" >
              <div className="usy-dt">
                <div className="usy-name">
                  <h3>{dogadjaj.dogadjaj_Id.userName_Kreatora}</h3>
                  <span><img src="/images/clock.png" />{new Date(dogadjaj.dogadjaj_Id.datum_Objave).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="job_descp">
              <h3>{dogadjaj.dogadjaj_Id.naslov}</h3>
              <ul className="job-dt">
                <li><a href="#">{dogadjaj.dogadjaj_Id.kategorija}</a></li>
                <li><span>{new Date(dogadjaj.dogadjaj_Id.datum_Dogadjaja).toLocaleDateString()} od {dogadjaj.dogadjaj_Id.vreme_pocetka}</span></li>
              </ul>
              <p>{dogadjaj.dogadjaj_Id.opis}</p>
              {dogadjaj.dogadjaj_Id.dogadjajImage && (
                <img src={`${API_BASE}/resources/${dogadjaj.dogadjaj_Id.dogadjajImage}`} className='rounded float-left dogadjaj-slika' />
              )}
              <HideShowMapa
                latitude={dogadjaj.dogadjaj_Id.x}
                longitude={dogadjaj.dogadjaj_Id.y}
              />
              <p>Broj prijava: <span>{dogadjaj.broj_prijava}</span></p>
            </div>
            <div className="job-status-bar">
              <ul className="like-com d-flex">
                <li className="komentardiv" onClick={(event) => otvoriDiv(event, dogadjaj.dogadjaj_Id.id)}>
                  <img src="/images/com.png" className="com-slika" />
                  <a href="#" className="com">Razlozi</a>
                </li>
                <li className="prijavidiv" onClick={(e) => BlokirajFunc(e, dogadjaj.dogadjaj_Id.iD_Kreatora, dogadjaj.dogadjaj_Id.userName_Kreatora)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Blokiraj</a>
                </li>
                <li className="prijavidiv" onClick={(e) => ObrisiFunc(e, dogadjaj.id, dogadjaj.dogadjaj_Id.id, dogadjaj.dogadjaj_Id.naslov)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Obriši</a>
                </li>
                <li className="prijavidiv" onClick={(e) => IgnorisiFunc(e, dogadjaj.id)}>
                  <img src="/images/report17.png" />
                  <a href="#" className="report-to-admin">Ignoriši</a>
                </li>
              </ul>
            </div>
            <div className="comment-section" style={{ display: 'none' }} id={dogadjaj.dogadjaj_Id.id}>
              <Razlog jedan_dog={dogadjaj} />
            </div>
          </div>))}
        <KrajListe lista={lista} />
      </div>
    );
  
}

export default Pr_Dog;