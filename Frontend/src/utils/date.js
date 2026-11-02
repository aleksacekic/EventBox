// Datumi i vreme na jednom mestu (date-fns; ranije moment, koji je zastareo i ~70 KB).
//
// Backend salje dve vrste vremena:
//  - kalendarske datume (datum dogadjaja, datum objave, rodjendan): "2026-10-08T00:00:00",
//    citaju se kao lokalni dan - bez pomeranja zbog vremenske zone
//  - trenutke u UTC (komentari, poruke, notifikacije): "2026-10-08T21:55:32.35Z" ili isto bez
//    "Z" kad dolaze iz baze - uvek se tretiraju kao UTC i prikazuju u lokalnom vremenu
import { format, isValid, parseISO } from 'date-fns'

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

const formatOrEmpty = (d, sablon) => (d ? format(d, sablon) : '')

// 08.10.2026
export const formatDate = (vrednost) => formatOrEmpty(parseDate(vrednost), 'dd.MM.yyyy')
// 08.10.2026. 21:55 (vreme iz UTC prikazano lokalno)
export const formatDateTime = (vrednost) => formatOrEmpty(parseUtcDate(vrednost), 'dd.MM.yyyy. HH:mm')
// 21:55 (vreme iz UTC prikazano lokalno)
export const formatTime = (vrednost) => formatOrEmpty(parseUtcDate(vrednost), 'HH:mm')
