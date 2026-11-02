import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, API_BASE } from '../api';
import Avatar from './Avatar';
import HideShowMapa from './Hide&ShowMapa';
import { formatDatum } from '../utils/datum';
import { jeZavrsen } from '../utils/dogadjaj';
import { RAZLOZI_PRIJAVE, adminKorisnikUrl, brojSaImenicom } from '../utils/admin';

// Kartica dogadjaja za administratora. Izgled je isti kao kartica na feedu (dogadjaj-card-*),
// ali bez reakcija i komentara, a sa akcijama moderacije.
//  - prijava: red iz /Pr_dog/VratiPrijavljene_dog (broj prijava + do 5 razloga) kad se
//    kartica prikazuje u listi prijava; tada postoje i "Razlozi" i "Odbaci prijavu"
//  - prikaziAutora=false: na pregledu korisnika (autor je vec prikazan iznad liste,
//    a blokiranje je dugme na kartici korisnika)
function AdminDogadjajKartica({ dogadjaj, prijava, onObrisan, onPrijavaOdbacena, prikaziAutora = true }) {
  const navigate = useNavigate();
  const [razloziOtvoreni, setRazloziOtvoreni] = useState(false);
  const [radi, setRadi] = useState(false); // dok traje jedna akcija, dugmad su iskljucena
  const zavrsen = jeZavrsen(dogadjaj);

  const akcija = async (pitanje, posao) => {
    if (radi || !window.confirm(pitanje)) return;
    setRadi(true);
    try {
      await posao();
    } finally {
      setRadi(false);
    }
  };

  const obrisi = () => akcija(
    `Trajno obrisati dogadjaj "${dogadjaj.naslov}"? Brisu se i njegovi komentari, reakcije i prijave.`,
    async () => {
      try {
        await api.del(`/Dogadjaj/IzbrisiDogadjaj/${dogadjaj.id}`);
        toast.success('Dogadjaj je obrisan.');
        onObrisan?.(dogadjaj.id);
      } catch (error) {
        console.error('Brisanje nije uspelo:', error);
        toast.error('Brisanje nije uspelo. Pokusajte ponovo.');
      }
    }
  );

  const blokirajAutora = () => akcija(
    `Blokirati korisnika @${dogadjaj.userName_Kreatora}? Odmah ce biti odjavljen i nece moci da se prijavi.`,
    async () => {
      try {
        await api.put(`/Korisnik/BlokirajKorisnika/${dogadjaj.iD_Kreatora}`);
        toast.success(`Korisnik @${dogadjaj.userName_Kreatora} je blokiran.`);
      } catch (error) {
        console.error('Blokiranje nije uspelo:', error);
        toast.error('Blokiranje nije uspelo. Pokusajte ponovo.');
      }
    }
  );

  const odbaciPrijavu = () => akcija(
    'Odbaciti prijavu? Dogadjaj ostaje objavljen, a razlozi prijave se brisu.',
    async () => {
      try {
        await api.del(`/Pr_dog/IzbrisiPrijavljeniDogadjaj/${prijava.id}`);
        toast.success('Prijava je odbacena.');
        onPrijavaOdbacena?.(prijava.id);
      } catch (error) {
        console.error('Odbacivanje nije uspelo:', error);
        toast.error('Odbacivanje nije uspelo. Pokusajte ponovo.');
      }
    }
  );

  const objavljeno = (
    <span><i className="la la-clock-o" />Objavljeno {formatDatum(dogadjaj.datum_Objave)}.</span>
  );

  return (
    <article className="dogadjaj-card admin-kartica">
      <div className="dogadjaj-card-header">
        {prikaziAutora ? (
          <button
            type="button"
            className="dogadjaj-card-author admin-autor"
            onClick={() => navigate(adminKorisnikUrl(dogadjaj.iD_Kreatora))}
            title="Pregled korisnika"
          >
            <Avatar className="dogadjaj-card-avatar" slika={dogadjaj.slikaKorisnika} ime={dogadjaj.userName_Kreatora} />
            <span className="dogadjaj-card-author-info">
              <strong className="admin-autor-ime">@{dogadjaj.userName_Kreatora}</strong>
              {objavljeno}
            </span>
          </button>
        ) : (
          <div className="dogadjaj-card-author-info">{objavljeno}</div>
        )}

        {prijava && (
          <span className="admin-prijave-broj">
            <i className="la la-flag" /> {brojSaImenicom(prijava.broj_prijava, ['prijava', 'prijave', 'prijava'])}
          </span>
        )}
      </div>

      <div className="dogadjaj-card-body">
        <h3 className="dogadjaj-card-title">{dogadjaj.naslov}</h3>
        <div className="dogadjaj-card-meta">
          <span className="dogadjaj-card-badge">{dogadjaj.kategorija}</span>
          {zavrsen && <span className="dogadjaj-card-badge dogadjaj-card-badge-zavrsen">Zavrsen</span>}
          <span className="dogadjaj-card-when">
            <i className="la la-calendar" />
            {formatDatum(dogadjaj.datum_Dogadjaja)}. od {dogadjaj.vreme_pocetka}
          </span>
        </div>
        {dogadjaj.opis && <p className="dogadjaj-card-desc">{dogadjaj.opis}</p>}
        {dogadjaj.dogadjajImage && (
          <img src={`${API_BASE}/resources/${dogadjaj.dogadjajImage}`} alt="" loading="lazy" className="dogadjaj-card-image" />
        )}
        <HideShowMapa latitude={dogadjaj.x} longitude={dogadjaj.y} />
        <div className="admin-reakcije" aria-label="Reakcije korisnika">
          <span><i className="la la-thumbs-up" /> {dogadjaj.broj_Zainteresovanih} zainteresovano</span>
          <span><i className="la la-question-circle" /> {dogadjaj.broj_Mozda} mozda</span>
          <span><i className="la la-thumbs-down" /> {dogadjaj.broj_Nezainteresovanih} nezainteresovano</span>
        </div>
      </div>

      {prijava && razloziOtvoreni && (
        <ul className="admin-razlozi">
          {prijava.razlozi.map((r) => (
            <li key={r.id}>
              <span className="admin-razlog-oznaka">{RAZLOZI_PRIJAVE[r.razlog_prijave] ?? r.razlog_prijave}</span>
              {r.opis && <p>{r.opis}</p>}
            </li>
          ))}
          {/* Server uz svaku prijavu salje najvise 5 razloga */}
          {prijava.broj_prijava > prijava.razlozi.length && (
            <li className="admin-razlozi-jos">
              i jos {brojSaImenicom(prijava.broj_prijava - prijava.razlozi.length, ['prijava', 'prijave', 'prijava'])}
            </li>
          )}
        </ul>
      )}

      <div className="dogadjaj-card-actions admin-akcije">
        {prijava && (
          <>
            <button
              type="button"
              className={`dogadjaj-card-action ${razloziOtvoreni ? 'is-active' : ''}`}
              onClick={() => setRazloziOtvoreni((v) => !v)}
              aria-expanded={razloziOtvoreni}
            >
              <i className="la la-list" /> Razlozi
            </button>
            <button type="button" className="dogadjaj-card-action" onClick={odbaciPrijavu} disabled={radi}>
              <i className="la la-check" /> Odbaci prijavu
            </button>
          </>
        )}
        {prikaziAutora && (
          <button type="button" className="dogadjaj-card-action" onClick={blokirajAutora} disabled={radi}>
            <i className="la la-ban" /> Blokiraj autora
          </button>
        )}
        <button type="button" className="dogadjaj-card-action is-danger" onClick={obrisi} disabled={radi}>
          <i className="la la-trash" /> Obrisi dogadjaj
        </button>
      </div>
    </article>
  );
}

export default AdminDogadjajKartica;
