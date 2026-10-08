import { uDatum } from './datum'

// Dogadjaj je "zavrsen" kad mu je pocetak (datum + vreme) u proslosti.
export function jeZavrsen(dogadjaj) {
  const datum = uDatum(dogadjaj.datum_Dogadjaja)
  const [sat, minut] = String(dogadjaj.vreme_pocetka ?? '').split(':').map(Number)
  if (!datum || Number.isNaN(sat) || Number.isNaN(minut)) return false
  const pocetak = new Date(datum.getFullYear(), datum.getMonth(), datum.getDate(), sat, minut)
  return pocetak < new Date()
}
