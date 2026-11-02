// Zajednicko za admin deo: tabovi admin stranice, adrese i tekstovi razloga prijave.

// Tabovi admin stranice (/admin?tab=...). Koriste ih Header (navigacija) i Footer.
export const ADMIN_TABOVI = [
  { tab: 'prijave', label: 'Prijave', ikona: 'la-flag' },
  { tab: 'dogadjaji', label: 'Dogadjaji', ikona: 'la-calendar' },
  { tab: 'blokirani', label: 'Blokirani', ikona: 'la-ban' },
]

// Sve admin strane: tabovi + Administratori (otvara se iz menija profila u headeru, retko se koristi)
export const ADMIN_STRANE = [
  ...ADMIN_TABOVI,
  { tab: 'administratori', label: 'Administratori', ikona: 'la-user-secret' },
]

export const adminTabUrl = (tab) => `/admin?tab=${tab}`
export const adminKorisnikUrl = (id) => `/admin?korisnik=${id}`

// Razlog prijave: kod iz baze -> tekst (iste opcije kao forma za prijavu u DogadjajKartica.jsx)
export const RAZLOZI_PRIJAVE = {
  nepozeljan: 'Nepozeljan sadrzaj',
  nasilje: 'Nasilje',
  terorizam: 'Terorizam',
  govor_mrznje: 'Govor mrznje',
  lazne_informacije: 'Lazne informacije',
  uznemiravanje: 'Uznemiravanje',
  ostalo: 'Ostalo',
}

// Broj sa imenicom u pravom obliku: 1 prijava, 3 prijave, 5 prijava, 21 prijava, 12 prijava
export function brojSaImenicom(n, [jedan, dva, pet]) {
  const d = n % 10
  const s = n % 100
  if (d === 1 && s !== 11) return `${n} ${jedan}`
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return `${n} ${dva}`
  return `${n} ${pet}`
}
