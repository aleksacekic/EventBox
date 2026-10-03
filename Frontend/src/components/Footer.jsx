import React from 'react'
import { Link } from 'react-router-dom'
import { INFO_STRANICE } from '../infoStranice'

const BRZI_LINKOVI = [
  { to: '/pocetna', label: 'Pocetna' },
  { to: '/profil', label: 'Profil' },
  { to: '/chat', label: 'Poruke' },
]

function Footer() {
  return (
    <footer className="app-footer">
      <div className="container app-footer-inner">
        <div className="app-footer-brand">
          <img src="/images/eb-logo-dugi2.png" alt="EventBox" />
          <p>Pronadji i organizuj dogadjaje u svom gradu.</p>
        </div>

        <div className="app-footer-col" role="navigation" aria-label="Navigacija">
          <h4>Navigacija</h4>
          <ul>
            {BRZI_LINKOVI.map((l) => (
              <li key={l.to}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div className="app-footer-col" role="navigation" aria-label="Informacije">
          <h4>Informacije</h4>
          <ul>
            {INFO_STRANICE.map((s) => (
              <li key={s.slug}><Link to={s.putanja}>{s.kratko}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-footer-bottom">
        <div className="container">
          <span>&copy; {new Date().getFullYear()} EventBox. Sva prava zadrzana.</span>
          <span>Napravio aleksacekic</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
