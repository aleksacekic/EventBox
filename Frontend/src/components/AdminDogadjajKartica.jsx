import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, API_BASE } from '../api';
import Avatar from './Avatar';
import HideShowMapa from './Hide&ShowMapa';
import AdminKomentari from './AdminKomentari';
import { formatDatum } from '../utils/datum';
import { jeZavrsen } from '../utils/dogadjaj';
import { RAZLOZI_PRIJAVE, adminKorisnikUrl, brojSaImenicom } from '../utils/admin';

// Kartica dogadjaja za administratora. Izgled je isti kao kartica na feedu (dogadjaj-card-*),
// ali bez reakcija i forme za komentar, a sa akcijama moderacije.
//  - prijava: red iz /Pr_dog/VratiPrijavljene_dog (broj prijava + do 5 razloga) kad se
//    kartica prikazuje u listi prijava; tada postoje i "Razlozi" i "Odbaci prijavu"
//  - prikaziAutora=false: na pregledu korisnika (autor je vec prikazan iznad liste,
//    a blokiranje je dugme na kartici korisnika)
function AdminDogadjajKartica({ dogadjaj, prijava, onObrisan, onPrijavaOdbacena, prikaziAutora = true }) {
  const navigate = useNavigate();
  const [panel, setPanel] = useState(null); // 'razlozi' | 'komentari' | null
  const [radi, setRadi] = useState(false); // dok traje jedna akcija, dugmad su iskljucena
  // Blokiran autor: dogadjaj je sakriven za korisnike (admin ga vidi). Menja se i odavde.
  const [autorBlokiran, setAutorBlokiran] = useState(Boolean(dogadjaj.kreatorBlokiran));
  const zavrsen = jeZavrsen(dogadjaj);

  const prebaciPanel = (ime) => setPanel((p) => (p === ime ? null : ime));

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

  const promeniBlokaduAutora = () => {
    const blokiraj = !autorBlokiran;
    const ime = `@${dogadjaj.userName_Kreatora}`;
    return akcija(
      blokiraj
        ? `Blokirati korisnika ${ime}? Odmah ce biti odjavljen, a njegovi dogadjaji i komentari se sakrivaju.`
        : `Odblokirati korisnika ${ime}? Ponovo ce moci da se prijavi, a njegov sadrzaj se opet vidi.`,
      async () => {
        try {
          await api.put(`/Korisnik/${blokiraj ? 'Blokiraj' : 'Odblokiraj'}Korisnika/${dogadjaj.iD_Kreatora}`);
          setAutorBlokiran(blokiraj);
          toast.success(`Korisnik ${ime} je ${blokiraj ? 'blokiran' : 'odblokiran'}.`);
        } catch (error) {
          console.error('Promena blokade nije uspela:', error);
          toast.error('Akcija nije uspela. Pokusajte ponovo.');
        }
      }
    );
  };

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
        {autorBlokiran && prikaziAutora && (
          <p className="admin-skriveno">
            <i className="la la-eye-slash" /> Autor je blokiran, pa korisnici ne vide ovaj dogadjaj.
          </p>
        )}
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

      <div className="dogadjaj-card-actions admin-akcije">
        {prijava && (
          <>
            <button
              type="button"
              className={`dogadjaj-card-action ${panel === 'razlozi' ? 'is-active' : ''}`}
              onClick={() => prebaciPanel('razlozi')}
              aria-expanded={panel === 'razlozi'}
            >
              <i className="la la-list" /> Razlozi
            </button>
            <button type="button" className="dogadjaj-card-action" onClick={odbaciPrijavu} disabled={radi}>
              <i className="la la-check" /> Odbaci prijavu
            </button>
          </>
        )}
        <button
          type="button"
          className={`dogadjaj-card-action ${panel === 'komentari' ? 'is-active' : ''}`}
          onClick={() => prebaciPanel('komentari')}
          aria-expanded={panel === 'komentari'}
        >
          <i className="la la-comments" /> Komentari
        </button>
        {prikaziAutora && (
          <button type="button" className="dogadjaj-card-action" onClick={promeniBlokaduAutora} disabled={radi}>
            <i className={`la ${autorBlokiran ? 'la-unlock' : 'la-ban'}`} /> {autorBlokiran ? 'Odblokiraj autora' : 'Blokiraj autora'}
          </button>
        )}
        <button type="button" className="dogadjaj-card-action is-danger" onClick={obrisi} disabled={radi}>
          <i className="la la-trash" /> Obrisi dogadjaj
        </button>
      </div>

      {prijava && panel === 'razlozi' && (
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

      {panel === 'komentari' && <AdminKomentari dogadjajId={dogadjaj.id} />}
    </article>
  );
}

export default AdminDogadjajKartica;
