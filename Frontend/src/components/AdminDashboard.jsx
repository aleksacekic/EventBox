import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdminReports from './AdminReports';
import AdminEvents from './AdminEvents';
import AdminUserDetails from './AdminUserDetails';
import AdminBlockedUsers from './AdminBlockedUsers';
import AdminAccounts from './AdminAccounts';
import { ADMIN_STRANE } from '../utils/admin';

// Admin stranica. Sta se prikazuje zavisi od adrese, pa radi i "Nazad" u brauzeru i
// link se moze podeliti:
//   /admin?tab=prijave | dogadjaji | blokirani   (tabovi su u headeru)
//   /admin?tab=administratori                    (iz menija profila u headeru)
//   /admin?korisnik=ID                           (pregled korisnika, iz pretrage ili sa kartice)
function AdminDashboard() {
  const [params] = useSearchParams();
  const korisnikId = params.get('korisnik');
  const trazeniTab = params.get('tab');
  const tab = ADMIN_STRANE.some((t) => t.tab === trazeniTab) ? trazeniTab : 'prijave';

  // Novi tab ili korisnik: pocni od vrha strane
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, korisnikId]);

  let sadrzaj;
  if (korisnikId) sadrzaj = <AdminUserDetails key={korisnikId} id={korisnikId} />;
  else if (tab === 'dogadjaji') sadrzaj = <AdminEvents />;
  else if (tab === 'blokirani') sadrzaj = <AdminBlockedUsers />;
  else if (tab === 'administratori') sadrzaj = <AdminAccounts />;
  else sadrzaj = <AdminReports />;

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

export default AdminDashboard;
