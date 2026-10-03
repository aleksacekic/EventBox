import React from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { INFO_STRANICE, KONTAKT_EMAIL } from '../infoStranice'

// Jedna komponenta za sve informativne strane iz footera (O nama, Pravila, ...).
function InfoStranica({ slug }) {
  const stranica = INFO_STRANICE.find((s) => s.slug === slug)

  return (
    <div className="wrapper">
      <Header />
      <main className="info-main">
        <div className="container">
          <div className="info-strana">
            <div className="info-nav" role="navigation" aria-label="Informacije">
              {INFO_STRANICE.map((s) => (
                <Link
                  key={s.slug}
                  to={s.putanja}
                  className={`info-nav-link ${s.slug === slug ? 'is-active' : ''}`}
                  aria-current={s.slug === slug ? 'page' : undefined}
                >
                  {s.kratko}
                </Link>
              ))}
            </div>

            <article className="info-card">
              <h1>{stranica.naslov}</h1>
              <p className="info-uvod">{stranica.uvod}</p>

              {stranica.kontakt && (
                <a className="info-kontakt" href={`mailto:${KONTAKT_EMAIL}`}>
                  <i className="la la-envelope" />
                  <span>
                    <small>Email</small>
                    <strong>{KONTAKT_EMAIL}</strong>
                  </span>
                </a>
              )}

              {stranica.sekcije.map((sekcija) => (
                <div key={sekcija.naslov}>
                  <h2>{sekcija.naslov}</h2>
                  {sekcija.tekst?.map((p) => <p key={p}>{p}</p>)}
                  {sekcija.lista && (
                    <ul>
                      {sekcija.lista.map((stavka) => <li key={stavka}>{stavka}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default InfoStranica
