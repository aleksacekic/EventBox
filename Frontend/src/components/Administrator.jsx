import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdminPrijave from './AdminPrijave';
import AdminDogadjaji from './AdminDogadjaji';
import AdminKorisnik from './AdminKorisnik';
import BlokiraniKorisnici from './BlokiraniKorisnici';
import { ADMIN_TABOVI } from '../utils/admin';

// Admin stranica. Sta se prikazuje zavisi od adrese, pa radi i "Nazad" u brauzeru i
// link se moze podeliti:
//   /admin?tab=prijave | dogadjaji | blokirani   (tabovi su u headeru)
//   /admin?korisnik=ID                           (pregled korisnika, iz pretrage ili sa kartice)
function Administrator() {
  const [params] = useSearchParams();
  const korisnikId = params.get('korisnik');
  const trazeniTab = params.get('tab');
  const tab = ADMIN_TABOVI.some((t) => t.tab === trazeniTab) ? trazeniTab : 'prijave';

  // Novi tab ili korisnik: pocni od vrha strane
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, korisnikId]);

  let sadrzaj;
  if (korisnikId) sadrzaj = <AdminKorisnik key={korisnikId} id={korisnikId} />;
  else if (tab === 'dogadjaji') sadrzaj = <AdminDogadjaji />;
  else if (tab === 'blokirani') sadrzaj = <BlokiraniKorisnici />;
  else sadrzaj = <AdminPrijave />;

  return (
    <>
      <Header />
      <main className="admin-strana">
        <div className="container admin-kontejner">{sadrzaj}</div>
      </main>
      <Footer />
    </>
  );
}

export default Administrator;
