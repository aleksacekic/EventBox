// ============================================================================
//  Prevodi (i18next + react-i18next)
// ----------------------------------------------------------------------------
//  Podrazumevani jezik je engleski; izbor (dugme EN | SR) se pamti u browseru.
//  U komponentama:  const { t } = useTranslation();  t('header.logout')
//  Van komponenti (npr. api.js, utils):  i18n.t('...'), i18n.language
//  Recnici su u en.js i sr.js (isti kljucevi u oba fajla).
// ============================================================================
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import sr from './sr'

export const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'sr', label: 'SR', name: 'Srpski' },
]

const STORAGE_KEY = 'eventbox-language'
const DEFAULT_LANGUAGE = 'en'

// localStorage moze da baci gresku (privatni prozor, blokirani kolacici) - tada vazi podrazumevani jezik
function savedLanguage() {
  try {
    const lang = localStorage.getItem(STORAGE_KEY)
    return LANGUAGES.some((l) => l.code === lang) ? lang : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, sr: { translation: sr } },
  lng: savedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map((l) => l.code),
  interpolation: { escapeValue: false }, // React vec sam escapuje tekst
  initAsync: false, // recnici su vec ucitani, pa prevodi rade odmah, bez cekanja
})

function onLanguageChanged(lang) {
  document.documentElement.lang = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    // izbor jezika se tada ne pamti, ali promena radi
  }
}

i18n.on('languageChanged', onLanguageChanged)
document.documentElement.lang = i18n.language

export default i18n
