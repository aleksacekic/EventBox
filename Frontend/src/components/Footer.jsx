import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { INFO_STRANICE, infoSadrzaj } from '../infoStranice'
import { useAuth } from '../auth'
import { ADMIN_STRANE, adminTabUrl } from '../utils/admin'

const BRZI_LINKOVI = [
  { to: '/pocetna', labelKey: 'nav.home' },
  { to: '/profil', labelKey: 'nav.profile' },
  { to: '/chat', labelKey: 'nav.messages' },
]

function Footer() {
  const { t, i18n } = useTranslation()
  const { isAdmin } = useAuth()
  // Administrator nema Pocetnu, Profil ni Poruke - umesto njih linkovi na admin tabove
  const linkovi = isAdmin
    ? ADMIN_STRANE.map((s) => ({ to: adminTabUrl(s.tab), labelKey: s.labelKey }))
    : BRZI_LINKOVI

  return (
    <footer className="app-footer">
      <div className="container app-footer-inner">
        <div className="app-footer-brand">
          <img src="/images/eb-logo-dugi2.png" alt="EventBox" />
          <p>{t('footer.tagline')}</p>
        </div>

        <div className="app-footer-col" role="navigation" aria-label={t('footer.navigation')}>
          <h4>{t('footer.navigation')}</h4>
          <ul>
            {linkovi.map((l) => (
              <li key={l.to}><Link to={l.to}>{t(l.labelKey)}</Link></li>
            ))}
          </ul>
        </div>

        <div className="app-footer-col" role="navigation" aria-label={t('footer.info')}>
          <h4>{t('footer.info')}</h4>
          <ul>
            {INFO_STRANICE.map((s) => (
              <li key={s.slug}><Link to={s.putanja}>{infoSadrzaj(s, i18n.resolvedLanguage).kratko}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="app-footer-bottom">
        <div className="container">
          <span>&copy; {new Date().getFullYear()} EventBox. {t('footer.rights')}</span>
          <span>{t('footer.madeBy', { name: 'aleksacekic' })}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
