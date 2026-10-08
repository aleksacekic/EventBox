// ============================================================================
//  Uzivo veza sa serverom - jedna SignalR konekcija dok je korisnik ulogovan
// ----------------------------------------------------------------------------
//  Montirana jednom u App.jsx (iznad <Router>), pa radi na svakoj strani.
//
//  Server (Backend/Models/Obavestenja.cs) PRVO upise notifikaciju/poruku u bazu,
//  PA je posalje ovde. Klijent nista ne upisuje sam - ako korisnik nije online,
//  sve ga ceka u bazi i ucita se pri sledecem ulasku.
//
//  Konekcija se prijavljuje istim tokenom kao API (accessTokenFactory), pa server
//  zna ko je korisnik iz tokena, a ne iz ID-a koji bi klijent mogao da izmisli.
//
//  Daje:
//    notifications            - poslednjih 5 notifikacija (NotifikacijaDto sa servera)
//    ucitajNotifikacije()     - ponovo ucitaj sa servera (npr. posle brisanja dogadjaja)
//    neprocitanePoruke        - broj za znacku u headeru
//    postaviNeprocitane(n)    - npr. posle OznaciKaoProcitano (server vraca novi broj)
//    pretplatiNaPoruke(fn)    - fn(poruka) za svaku novu poruku; vraca funkciju za odjavu
// ============================================================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'
import { api, API_BASE } from './api'
import { useAuth } from './auth'

const NotificationsContext = createContext(null)
const MAX_NOTIFIKACIJA = 5

export function NotificationsProvider({ children }) {
  const { userId, token } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [neprocitanePoruke, setNeprocitanePoruke] = useState(0)
  const pretplatniciRef = useRef(new Set())

  const ucitajNotifikacije = useCallback(async () => {
    if (!userId) return
    try {
      setNotifications(await api.get(`/Korisnik/VratiPetNotifikacijaKorisnika/${userId}`))
    } catch (error) {
      console.error('Greska pri ucitavanju notifikacija:', error)
    }
  }, [userId])

  const ucitajNeprocitane = useCallback(async () => {
    if (!userId) return
    try {
      setNeprocitanePoruke(await api.get(`/Poruka/KolikoNeprocitanihPoruka/${userId}`))
    } catch (error) {
      console.error('Greska pri ucitavanju broja neprocitanih poruka:', error)
    }
  }, [userId])

  const pretplatiNaPoruke = useCallback((fn) => {
    pretplatniciRef.current.add(fn)
    return () => pretplatniciRef.current.delete(fn)
  }, [])

  useEffect(() => {
    if (!userId || !token) {
      setNotifications([])
      setNeprocitanePoruke(0)
      return
    }

    ucitajNotifikacije()
    ucitajNeprocitane()

    const conn = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/notificationHub`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    conn.on('NovaNotifikacija', (n) => {
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, MAX_NOTIFIKACIJA))
    })

    // Autor je izmenio komentar - notifikacija ostaje na istom mestu sa novim tekstom
    conn.on('NotifikacijaIzmenjena', (n) => {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? n : x)))
    })

    // Autor je obrisao komentar ili povukao reakciju - notifikacija nestaje, a lista se
    // ponovo ucita da bi se popunila do 5
    conn.on('NotifikacijaObrisana', (id) => {
      setNotifications((prev) => prev.filter((x) => x.id !== id))
      ucitajNotifikacije()
    })

    conn.on('NovaPoruka', (poruka) => {
      setNeprocitanePoruke((b) => b + 1)
      pretplatniciRef.current.forEach((fn) => fn(poruka))
    })

    // Posle prekida veze moglo je nesto da stigne dok nismo bili povezani
    conn.onreconnected(() => {
      ucitajNotifikacije()
      ucitajNeprocitane()
    })

    let ugasena = false
    conn.start().catch((err) => {
      // StrictMode (dev) montira efekat dvaput: prvi connect se gasi usred
      // pregovaranja i baca AbortError - to je ocekivano, ne greska
      if (!ugasena) console.error('SignalR konekcija nije uspela:', err)
    })

    return () => {
      ugasena = true
      conn.stop()
    }
  }, [userId, token, ucitajNotifikacije, ucitajNeprocitane])

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        ucitajNotifikacije,
        neprocitanePoruke,
        postaviNeprocitane: setNeprocitanePoruke,
        pretplatiNaPoruke,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications mora biti unutar <NotificationsProvider>')
  }
  return ctx
}

// Server cuva vreme u UTC; ako stigne bez oznake zone (stari zapisi), tretira se kao UTC
export function uLokalnoVreme(vreme) {
  if (!vreme) return null
  const s = String(vreme)
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + 'Z')
}

const REAKCIJE = {
  Zainteresovan: 'je zainteresovan za',
  Mozda: 'mozda dolazi na',
  Nezainteresovan: 'nije zainteresovan za',
}

// Tekst notifikacije za prikaz
export function tekstNotifikacije(n) {
  const ko = n.korisnikKojiReaguje || 'Neko'
  const gde = `"${n.naslovDogadjaja}"`
  if (n.tip === 'Reakcija') return `${ko} ${REAKCIJE[n.sadrzaj] || 'je reagovao na'} vas dogadjaj ${gde}.`
  if (n.tip === 'Komentar') return `${ko} je komentarisao vas dogadjaj ${gde}: "${n.sadrzaj}"`
  if (n.tip === 'Prijava') return `Vas dogadjaj ${gde} je prijavljen${n.sadrzaj ? ` (razlog: ${n.sadrzaj.replace(/_/g, ' ')})` : ''}.`
  return `Nova aktivnost na vasem dogadjaju ${gde}.`
}
