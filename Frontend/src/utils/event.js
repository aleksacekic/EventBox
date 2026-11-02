import { parseDate } from './date'

// Vrednosti iz baze (prikazuju se prevedene: categories.*, reportReasons.*, reactions.*).
// Iste vrednosti proverava i server (DogadjajZahtev, Razlog, Reakcija).
export const CATEGORIES = ['Ostalo', 'Zurka', 'Humanitarna akcija', 'Ekoloska akcija', 'Sportski dogadjaj', 'Koncert']
export const REPORT_REASONS = ['nepozeljan', 'nasilje', 'terorizam', 'govor_mrznje', 'lazne_informacije', 'uznemiravanje', 'ostalo']

// Naziv kategorije na izabranom jeziku (nepoznata vrednost se prikazuje kakva jeste)
export const categoryLabel = (t, kategorija) => t(`categories.${kategorija}`, { defaultValue: kategorija })

// Dogadjaj je "zavrsen" kad mu je pocetak (datum + vreme) u proslosti.
export function isEventFinished(dogadjaj) {
  const datum = parseDate(dogadjaj.datum_Dogadjaja)
  const [sat, minut] = String(dogadjaj.vreme_pocetka ?? '').split(':').map(Number)
  if (!datum || Number.isNaN(sat) || Number.isNaN(minut)) return false
  const pocetak = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), sat, minut)
  return pocetak < new Date()
}
