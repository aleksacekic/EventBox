import { api, API_BASE } from '../api';
import { useAuth } from '../auth';
import React from 'react';
import { useEffect, useState } from 'react';


function Komentari({ dogadjajId, prikazaniDogadjaj, korisnikovaSlika, onDogadjajIdSubmit}) {

  const { userId } = useAuth();
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
      const korisnik_Id = userId;
      // 401 (npr. token istekao) -> api klijent sam vraca na /login
      await api.post(
        `/Komentar/PostaviKomentar/${korisnik_Id}/${dogadjajId}`,
        { tekst: noviKomentar },
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
      await api.put(`/Komentar/IzmeniKomentar?id=${commentId}`, { tekst: izmenjenTekstKomentara });
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
      const korisnik_Id = userId;
      const data = await api.get(`/Korisnik/VratiKorisnika_ID/${korisnik_Id}`);
      setKorisnik(data);
    } catch (error) {
      console.log(error);
    }
  };



  return (
    <div className="komentar-wrap">
      {komentari.length > 0 && dogadjajId === prikazaniDogadjaj ? (
        <ul className="komentar-lista">

          {komentari[0].komentari.map((komentar) => (  //MORA komentari[0] jer niz komentari sadrzi samo jedan objekat koji ima svoje polje komentari, a unutar tog polja se nalazi niz nasih komentara

            <li key={komentar.id} className="komentar-item">
              <img
                className="komentar-avatar"
                src={komentar.slikaKorisnika ? `${API_BASE}/resources/${komentar.slikaKorisnika}` : "http://via.placeholder.com/40x40"}
              />

              <div className="komentar-sadrzaj">
                <div className="komentar-bubble">
                  <h3>{komentar.username_korisnika}</h3>
                  {izabraniKomentarId === komentar.id ? (
                    <input
                      className="komentar-edit-input"
                      type="text"
                      value={izmenjenTekstKomentara}
                      onChange={(e) => setIzmenjenTekstKomentara(e.target.value)}
                    />
                  ) : (
                    <p>{komentar.tekst}</p>
                  )}
                </div>
                <div className="komentar-footer">
                  <span className="komentar-vreme">
                    <i className="la la-clock-o" /> 3 min ago
                  </span>
                  {korisnik && korisnik.korisnicko_Ime === komentar.username_korisnika && (
                    <div className="komentar-akcije">
                      {izabraniKomentarId === komentar.id ? (
                        <>
                          <button type="button" onClick={() => handleUpdateComment(komentar.id)}>
                            Sacuvaj
                          </button>
                          <button type="button" onClick={() => setIzabraniKomentarId(null)}>
                            Odustani
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => handleEditComment(komentar.id, komentar.tekst)}>
                          Izmeni
                        </button>
                      )}
                      <button type="button" className="komentar-akcija-obrisi" onClick={() => handleDeleteComment(komentar.id)}>
                        Obrisi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="komentar-prazno">Trenutno nema komentara.</p>
      )}


      <form className="komentar-forma" onSubmit={handleFormSubmit}>
        <img
          className="komentar-avatar"
          src={korisnikovaSlika ? `${API_BASE}/resources/${korisnikovaSlika}` : "http://via.placeholder.com/40x40"}
        />
        <input
          className="komentar-input"
          type="text"
          placeholder="Postavi komentar"
          value={noviKomentar}
          onChange={handleInputChange} />
        <button type="submit" className="komentar-posalji">Salji</button>
      </form>
    </div>
  );
};

export default Komentari;
