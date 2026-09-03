import { api, API_BASE } from '../api';
import React from 'react';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie'


function Komentari({ dogadjajId, prikazaniDogadjaj, korisnikovaSlika, onDogadjajIdSubmit}) {

  const [komentari, setKomentari] = useState([]);
  const [noviKomentar, setNoviKomentar] = useState('');
  const [izmenjenKomentar, setIzmenjenKomentar] = useState('');
  const [izabraniKomentarId, setIzabraniKomentarId] = useState(null);
  const [izmenjenTekstKomentara, setIzmenjenTekstKomentara] = useState('');
  const [korisnik, setKorisnik] = useState(null);
  

  // GET KOMENTARA
  useEffect(() => {
    fetchKomentari();
  }, [dogadjajId]);

  const fetchKomentari = async () => {
    try {
      const komentari = await api.get(`/Komentar/VratiKomentare/${dogadjajId}`);
      setKomentari(komentari);
    } catch (error) {
      console.error('Greska prilikom preuzimanja komentara!', error);
    }
  };
  //console.log(komentari);
  //console.log(typeof dogadjajId, typeof prikazaniDogadjaj);

  // POST KOMENTARA
  const handleInputChange = (event) => {
    setNoviKomentar(event.target.value);
  };



  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const korisnik_Id = Cookies.get("userID");
      // 401 (npr. token istekao) -> api klijent sam vraca na /login
      await api.post(
        `/Komentar/PostaviKomentar/${noviKomentar}/${korisnik_Id}/${dogadjajId}`,
        undefined,
        { credentials: 'include' }
      );
      fetchKomentari();
      setNoviKomentar('');
    } catch (error) {
      console.error('Greska prilikom slanja komentara!', error);
    }
  };

  // DELETE KOMENTARA
  const handleDeleteComment = async (commentId) => {
    try {
      await api.del(`/Komentar/IzbrisiKomentar/${commentId}`);
      fetchKomentari();
    } catch (error) {
      console.error('Greska prilikom brisanja komentara!', error);
    }
  };

  // PUT KOMENTARA
  const handleEditComment = (commentId, commentText) => {
    setIzabraniKomentarId(commentId);
    setIzmenjenTekstKomentara(commentText);
  };


  const handleUpdateComment = async (commentId) => {
    try {
      await api.put(`/Komentar/IzmeniKomentar?id=${commentId}&tekst=${izmenjenTekstKomentara}`);
      fetchKomentari();
      setIzabraniKomentarId(null);
      setIzmenjenTekstKomentara('');
    } catch (error) {
      console.error('Greska prilikom azuriranja komentara!', error);
    }
  };


  useEffect(() => {
    ucitajKorisnika();
  }, []);
  const ucitajKorisnika = async () => {
    try {
      const korisnik_Id = Cookies.get('userID');
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      setKorisnik(data);
    } catch (error) {
      console.log(error);
    }
  };

  

  return (
    <div>
      {komentari.length > 0 && dogadjajId === prikazaniDogadjaj ? (
        <div className="comment-sec" >
          <ul>

            {komentari[0].komentari.map((komentar) => (  //MORA komentari[0] jer niz komentari sadrzi samo jedan objekat koji ima svoje polje komentari, a unutar tog polja se nalazi niz nasih komentara

              <li key={komentar.id}>
                <div className="comment-list">
                  <div className="bg-img">
                  <img 
                  className='slikakorisnikakomentar'  
                   src={komentar.slikaKorisnika ? `${API_BASE}/resources/${komentar.slikaKorisnika}` : "http://via.placeholder.com/40x40"}
            />
            

                  </div>
                  <div className="comment">
                    <h3>{komentar.username_korisnika}</h3>
                    <span>
                      <img src="images/clock.png" alt="" />
                      3 min ago
                    </span>
                    <p>
                      {izabraniKomentarId === komentar.id ? (
                        <input
                          type="text"
                          value={izmenjenTekstKomentara}
                          onChange={(e) => setIzmenjenTekstKomentara(e.target.value)}
                        />
                      ) : (
                        komentar.tekst
                      )}
                    </p>
                    {korisnik && korisnik.korisnicko_Ime === komentar.username_korisnika ? (
                      <div className="comment-buttons">
                      {izabraniKomentarId === komentar.id ? (
                        <>
                          <button onClick={() => handleUpdateComment(komentar.id)}>
                            Sacuvaj
                          </button>
                          <button onClick={() => setIzabraniKomentarId(null)}>
                            Odustani
                          </button>
                        </>
                      ) : (
                        <button onClick={() => handleEditComment(komentar.id, komentar.tekst)}>
                          Izmeni
                        </button>
                      )}
                      <button onClick={() => handleDeleteComment(komentar.id)}>
                        Obrisi
                      </button>
                    </div>
                    ) : (console.log("Nema brt"))}
                      
                    
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p>Trenutno nema komentara.</p>
      )}


      <div className="post-comment">
        <div className="cm_img">

        <img 
                  className='slikakorisnikakomentar'  
                   src={korisnikovaSlika ? `${API_BASE}/resources/${korisnikovaSlika}` : "http://via.placeholder.com/40x40"}
            />

        </div>
        <div className="comment_box">
          <form onSubmit={handleFormSubmit}>
            <input
              type="text"
              placeholder="Postavi komentar"
              value={noviKomentar}
              onChange={handleInputChange} />
            <button type="submit">Salji</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Komentari;
