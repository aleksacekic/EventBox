import { api } from '../api';
import { useAuth } from '../auth';
import React from 'react';
import { useState } from 'react';
import { formatDateTime } from '../utils/date';
import { useInfiniteList } from '../useInfiniteList';
import Avatar from './Avatar';
import { useTranslation } from 'react-i18next';



function CommentSection({ dogadjajId, prikazaniDogadjaj, korisnikovaSlika, korisnikovoIme }) {

  const { userId } = useAuth();
  const { t } = useTranslation();
  // Najnovijih 10, a starije na dugme "Prikazi starije komentare". Lista je od starijih ka
  // novijim (direction 'up'), kao i do sada. Izmene (novi, izmenjen, obrisan) se primenjuju
  // lokalno, bez ponovnog ucitavanja svih komentara.
  const lista = useInfiniteList(`/api/events/${dogadjajId}/comments`, { limit: 10, direction: 'up' });
  const listaKomentara = lista.items;
  const josStarijih = lista.total != null ? Math.max(0, lista.total - listaKomentara.length) : 0;
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
      // 401 (npr. token istekao) -> api klijent sam vraca na /login
      if (!noviKomentar.trim()) return;
      const novi = await api.post(
        `/api/events/${dogadjajId}/comments`,
        { tekst: noviKomentar },
        { credentials: 'include' }
      );
      lista.setItems((prev) => [...prev, novi]);
      lista.setTotal((n) => (n ?? 0) + 1);
      setNoviKomentar('');
    } catch (error) {
      console.error('Greska prilikom slanja komentara!', error);
    }
  };

  // DELETE KOMENTARA
  const handleDeleteComment = async (commentId) => {
    try {
      await api.del(`/api/comments/${commentId}`);
      lista.setItems((prev) => prev.filter((k) => k.id !== commentId));
      lista.setTotal((n) => Math.max(0, (n ?? 1) - 1));
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
      const izmenjen = await api.put(`/api/comments/${commentId}`, { tekst: izmenjenTekstKomentara });
      lista.setItems((prev) => prev.map((k) => (k.id === commentId ? izmenjen : k)));
      setIzabraniKomentarId(null);
      setIzmenjenTekstKomentara('');
    } catch (error) {
      console.error('Greska prilikom azuriranja komentara!', error);
    }
  };





  return (
    <div className="komentar-wrap">
      {lista.hasMore && dogadjajId === prikazaniDogadjaj && (
        <button type="button" className="komentar-starije" onClick={lista.loadMore} disabled={lista.loading}>
          {lista.loading ? t('common.loading') : josStarijih ? t('comments.showOlderCount', { n: josStarijih }) : t('comments.showOlder')}
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
                    <i className="la la-clock-o" /> {formatDateTime(komentar.vreme)}
                  </span>
                  {String(komentar.autorId) === String(userId) && (
                    <div className="komentar-akcije">
                      {izabraniKomentarId === komentar.id ? (
                        <>
                          <button type="button" onClick={() => handleUpdateComment(komentar.id)}>
                            {t('common.save')}
                          </button>
                          <button type="button" onClick={() => setIzabraniKomentarId(null)}>
                            {t('common.cancel')}
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => handleEditComment(komentar.id, komentar.tekst)}>
                          {t('common.edit')}
                        </button>
                      )}
                      <button type="button" className="komentar-akcija-obrisi" onClick={() => handleDeleteComment(komentar.id)}>
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : lista.initialLoading ? (
        <p className="komentar-prazno">{t('comments.loading')}</p>
      ) : (
        <p className="komentar-prazno">{t('comments.empty')}</p>
      )}


      <form className="komentar-forma" onSubmit={handleFormSubmit}>
        <Avatar className="komentar-avatar" slika={korisnikovaSlika} ime={korisnikovoIme} />
        <input
          className="komentar-input"
          type="text"
          maxLength={1000}
          placeholder={t('comments.placeholder')}
          value={noviKomentar}
          onChange={handleInputChange} />
        <button type="submit" className="komentar-posalji">{t('comments.send')}</button>
      </form>
    </div>
  );
};

export default CommentSection;
