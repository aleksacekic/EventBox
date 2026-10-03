import moment from 'moment'

// Dogadjaj je "zavrsen" kad mu je pocetak (datum + vreme) u proslosti.
export function jeZavrsen(dogadjaj) {
  const datum = moment(dogadjaj.datum_Dogadjaja).format('YYYY-MM-DD')
  const pocetak = moment(`${datum} ${dogadjaj.vreme_pocetka}`, 'YYYY-MM-DD H:mm')
  return pocetak.isValid() && pocetak.isBefore(moment())
}
