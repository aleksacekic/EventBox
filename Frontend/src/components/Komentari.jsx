import { api } from '../api';
import { useAuth } from '../auth';
import React from 'react';
import { useState } from 'react';
import { formatTrenutak } from '../utils/datum';
import { useBeskonacnaLista } from '../useBeskonacnaLista';
import Avatar from './Avatar';



function Komentari({ dogadjajId, prikazaniDogadjaj, korisnikovaSlika, korisnikovoIme }) {

  const { userId } = useAuth();
  // Najnovijih 10, a starije na dugme "Prikazi starije komentare". Lista je od starijih ka
  // novijim (smer 'gore'), kao i do sada. Izmene (novi, izmenjen, obrisan) se primenjuju
  // lokalno, bez ponovnog ucitavanja svih komentara.
  const lista = useBeskonacnaLista(`/Komentar/VratiKomentare/${dogadjajId}`, { limit: 10, smer: 'gore' });
  const listaKomentara = lista.stavke;
  const josStarijih = lista.ukupno != null ? Math.max(0, lista.ukupno - listaKomentara.length) : 0;
  const [noviKomentar, setNoviKomentar] = useState('');
  const [izabraniKomentarId, setIzabraniKomentarId] = useState(null);
  const [izmenjenTekstKomentara, setIzmenjenTekstKomentara] = useState('');


  // POST KOMENTARA
  const handleInputChange = (event) => {
    setNoviKomentar(event.target.value);
  };



  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const korisnik_Id = userId;
      // 401 (npr. token istekao) -> api klijent sam vraca na /login
      if (!noviKomentar.trim()) return;
      const novi = await api.post(
        `/Komentar/PostaviKomentar/${korisnik_Id}/${dogadjajId}`,
        { tekst: noviKomentar },
        { credentials: 'include' }
      );
      lista.setStavke((prev) => [...prev, novi]);
      lista.setUkupno((n) => (n ?? 0) + 1);
      setNoviKomentar('');
    } catch (error) {
      console.error('Greska prilikom slanja komentara!', error);
    }
  };

  // DELETE KOMENTARA
  const handleDeleteComment = async (commentId) => {
    try {
      await api.del(`/Komentar/IzbrisiKomentar/${commentId}`);
      lista.setStavke((prev) => prev.filter((k) => k.id !== commentId));
      lista.setUkupno((n) => Math.max(0, (n ?? 1) - 1));
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
      const izmenjen = await api.put(`/Komentar/IzmeniKomentar?id=${commentId}`, { tekst: izmenjenTekstKomentara });
      lista.setStavke((prev) => prev.map((k) => (k.id === commentId ? izmenjen : k)));
      setIzabraniKomentarId(null);
      setIzmenjenTekstKomentara('');
    } catch (error) {
      console.error('Greska prilikom azuriranja komentara!', error);
    }
  };





  return (
    <div className="komentar-wrap">
      {lista.imaJos && dogadjajId === prikazaniDogadjaj && (
        <button type="button" className="komentar-starije" onClick={lista.ucitajJos} disabled={lista.ucitava}>
          {lista.ucitava ? 'Ucitavam...' : `Prikazi starije komentare${josStarijih ? ` (${josStarijih})` : ''}`}
        </button>
      )}
      {listaKomentara.length > 0 && dogadjajId === prikazaniDogadjaj ? (
        <ul className="komentar-lista">

          {listaKomentara.map((komentar) => (

            <li key={komentar.id} className="komentar-item">
              <Avatar className="komentar-avatar" slika={komentar.slikaKorisnika} ime={komentar.username_korisnika} />

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
                    <i className="la la-clock-o" /> {formatTrenutak(komentar.vreme)}
                  </span>
                  {String(komentar.autorId) === String(userId) && (
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
      ) : lista.pocetno ? (
        <p className="komentar-prazno">Ucitavam komentare...</p>
      ) : (
        <p className="komentar-prazno">Trenutno nema komentara.</p>
      )}


      <form className="komentar-forma" onSubmit={handleFormSubmit}>
        <Avatar className="komentar-avatar" slika={korisnikovaSlika} ime={korisnikovoIme} />
        <input
          className="komentar-input"
          type="text"
          maxLength={1000}
          placeholder="Postavi komentar"
          value={noviKomentar}
          onChange={handleInputChange} />
        <button type="submit" className="komentar-posalji">Salji</button>
      </form>
    </div>
  );
};

export default Komentari;
