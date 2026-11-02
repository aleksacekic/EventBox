// Zajednicko za admin deo: tabovi admin stranice i adrese.
// Tekstovi (nazivi tabova, razlozi prijave) su u prevodima: admin.tabs.*, reportReasons.*

// Tabovi admin stranice (/admin?tab=...). Koriste ih Header (navigacija) i Footer.
export const ADMIN_TABOVI = [
  { tab: 'prijave', labelKey: 'admin.tabs.reports', ikona: 'la-flag' },
  { tab: 'dogadjaji', labelKey: 'admin.tabs.events', ikona: 'la-calendar' },
  { tab: 'blokirani', labelKey: 'admin.tabs.blocked', ikona: 'la-ban' },
]

// Sve admin strane: tabovi + Administratori (otvara se iz menija profila u headeru, retko se koristi)
export const ADMIN_STRANE = [
  ...ADMIN_TABOVI,
  { tab: 'administratori', labelKey: 'admin.tabs.admins', ikona: 'la-user-secret' },
]

export const adminTabUrl = (tab) => `/admin?tab=${tab}`
export const adminUserUrl = (id) => `/admin?korisnik=${id}`
