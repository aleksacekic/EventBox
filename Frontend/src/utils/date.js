// Datumi i vreme na jednom mestu (date-fns; ranije moment, koji je zastareo i ~70 KB).
//
// Backend salje dve vrste vremena:
//  - kalendarske datume (datum dogadjaja, datum objave, rodjendan): "2026-10-08T00:00:00",
//    citaju se kao lokalni dan - bez pomeranja zbog vremenske zone
//  - trenutke u UTC (komentari, poruke, notifikacije): "2026-10-08T21:55:32.35Z" ili isto bez
//    "Z" kad dolaze iz baze - uvek se tretiraju kao UTC i prikazuju u lokalnom vremenu
//
// Format zavisi od izabranog jezika: srpski "08.10.2026.", engleski "8 Oct 2026".
import { format, isValid, parseISO } from 'date-fns'
import enGB from 'date-fns/locale/en-GB'
import srLatn from 'date-fns/locale/sr-Latn'
import { registerLocale } from 'react-datepicker'
import i18n from '../i18n'

const FORMATS = {
  en: { date: 'd MMM yyyy', dateTime: 'd MMM yyyy, HH:mm', picker: 'd MMM yyyy', locale: enGB, pickerLocale: 'en-GB' },
  sr: { date: 'dd.MM.yyyy.', dateTime: 'dd.MM.yyyy. HH:mm', picker: 'd.M.yyyy.', locale: srLatn, pickerLocale: 'sr-Latn' },
}

// Kalendar (react-datepicker) na oba jezika; nedelja pocinje ponedeljkom
registerLocale('en-GB', enGB)
registerLocale('sr-Latn', srLatn)

const current = () => FORMATS[i18n.resolvedLanguage] ?? FORMATS.en

// Kalendarski datum -> Date (lokalno). Prima i Date.
export function parseDate(vrednost) {
  if (!vrednost) return null
  const d = vrednost instanceof Date ? vrednost : parseISO(String(vrednost))
  return isValid(d) ? d : null
}

// UTC trenutak -> Date. Bez oznake zone se dodaje "Z".
export function parseUtcDate(vrednost) {
  if (!vrednost) return null
  if (vrednost instanceof Date) return vrednost
  const s = String(vrednost)
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z')
  return isValid(d) ? d : null
}

const formatOrEmpty = (d, sablon) => (d ? format(d, sablon, { locale: current().locale }) : '')

// 08.10.2026. / 8 Oct 2026
export const formatDate = (vrednost) => formatOrEmpty(parseDate(vrednost), current().date)
// 08.10.2026. 21:55 / 8 Oct 2026, 21:55 (vreme iz UTC prikazano lokalno)
export const formatDateTime = (vrednost) => formatOrEmpty(parseUtcDate(vrednost), current().dateTime)
// 21:55 (vreme iz UTC prikazano lokalno)
export const formatTime = (vrednost) => formatOrEmpty(parseUtcDate(vrednost), 'HH:mm')

// Za <DatePicker locale={...} dateFormat={...}>
export const datePickerLocale = () => current().pickerLocale
export const datePickerFormat = () => current().picker
