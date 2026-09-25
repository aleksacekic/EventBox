// ============================================================================
//  Notifikacije - jedna SignalR konekcija, ziva dok je korisnik ulogovan
// ----------------------------------------------------------------------------
//  Pre: konekcija (i to 3x duplirana - jedna po tipu dogadjaja: reakcija,
//  komentar, prijava) je zivela SAMO unutar Main.jsx, koji se montira jedino
//  na /pocetna. Efekat: vlasnik dogadjaja prima notifikaciju samo ako je u tom
//  trenutku bio na feedu. Ako je gledao deep-link stranu dogadjaja (/objava/:id),
//  profil, chat... Main.jsx nije montiran -> nema konekcije -> notifikacija se
//  ni ne snimi u bazu (to backend ne radi sam; klijent koji primi SignalR push
//  je taj koji zove /Notifikacija/PostaviNotifikaciju).
//
//  Sad: <NotificationsProvider> je montiran jednom u App.jsx (iznad <Router>),
//  pa konekcija postoji na svakoj strani sve dok je korisnik ulogovan.
// ============================================================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { HubConnectionBuilder } from '@microsoft/signalr'
import { api, API_BASE } from './api'
import { useAuth } from './auth'

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
  const { userId } = useAuth()
  const [notifications, setNotifications] = useState([])
  const connectionRef = useRef(null)

  const fetchDogadjaj = useCallback(async (id) => {
    try {
      if (!id) return null
      return await api.get(`/Dogadjaj/VratiDogadjaj/${id}`)
    } catch (error) {
      console.error('Greska pri dohvatanju dogadjaja:', error)
      return null
    }
  }, [])

  const fetchKorisnik = useCallback(async (id) => {
    try {
      if (!id) return null
      return await api.get(`/Korisnik/VratiKorisnika_ID/${id}`)
    } catch (error) {
      console.error('Greska pri dohvatanju korisnika:', error)
      return null
    }
  }, [])

  const postaviNotifikaciju = useCallback(async (dogadjajId, korisnikReagujeId, tip, sadrzaj, vreme, vlasnikId) => {
    try {
      return await api.post(`/Notifikacija/PostaviNotifikaciju/${dogadjajId}/${korisnikReagujeId}/${tip}/${sadrzaj}/${vreme}/${vlasnikId}`)
    } catch (error) {
      console.error('Greska pri cuvanju notifikacije:', error)
      return null
    }
  }, [])

  const ucitajNotifikacije = useCallback(async () => {
    if (!userId) return
    try {
      const data = await api.get(`/Korisnik/VratiPetNotifikacijaKorisnika/${userId}`)
      const mapirane = await Promise.all(
        data.map(async (not) => {
          const dogadjaj = await fetchDogadjaj(not.dogadjajId)
          const korisnik = await fetchKorisnik(not.korisnikKojiReagujeId)
          return {
            reactionType: not.tipReakcije || null,
            commentText: not.sadrzajReakcije || null,
            reason: not.tipReakcije || null,
            eventId: not.dogadjajId,
            eventName: dogadjaj?.naslov || 'Nepoznat dogadjaj',
            organizer: korisnik?.korisnicko_Ime || 'Nepoznat korisnik',
            time: new Date(not.vreme).toLocaleString('sr-RS'),
          }
        })
      )
      setNotifications(mapirane)
    } catch (error) {
      console.error('Greska pri ucitavanju notifikacija:', error)
    }
  }, [userId, fetchDogadjaj, fetchKorisnik])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    ucitajNotifikacije()

    const connect = new HubConnectionBuilder()
      .withUrl(`${API_BASE}/notificationHub?userId=${encodeURIComponent(userId)}`)
      .withAutomaticReconnect()
      .build()

    const dodajULokalnuListu = (novaNotifikacija) => {
      setNotifications((prev) => [novaNotifikacija, ...prev.slice(0, 4)]) // max 5
    }

    connect.on('ReceiveNewReaction', async (reactionType, eventId, reactingUserId) => {
      const dogadjaj = await fetchDogadjaj(eventId)
      const korisnikKojiReaguje = await fetchKorisnik(reactingUserId)
      if (!dogadjaj || !korisnikKojiReaguje) return

      await postaviNotifikaciju(
        eventId,
        korisnikKojiReaguje.id,
        reactionType,
        reactionType,
        new Date().toLocaleString('sv-SE'),
        dogadjaj.iD_Kreatora
      )
      dodajULokalnuListu({
        reactionType,
        eventId,
        eventName: dogadjaj.naslov,
        organizer: korisnikKojiReaguje.korisnicko_Ime,
        time: new Date().toLocaleString('sr-RS'),
      })
    })

    connect.on('ReceiveNewComment', async (commentText, eventId, reactingUserId) => {
      const dogadjaj = await fetchDogadjaj(eventId)
      const korisnikKojiReaguje = await fetchKorisnik(reactingUserId)
      if (!dogadjaj || !korisnikKojiReaguje) return

      await postaviNotifikaciju(
        eventId,
        korisnikKojiReaguje.id,
        commentText,
        commentText,
        new Date().toLocaleString('sv-SE'),
        dogadjaj.iD_Kreatora
      )
      dodajULokalnuListu({
        commentText,
        eventId,
        eventName: dogadjaj.naslov,
        organizer: korisnikKojiReaguje.korisnicko_Ime,
        time: new Date().toLocaleString('sr-RS'),
      })
    })

    connect.on('ReceiveEventReport', async (reason, eventId) => {
      const dogadjaj = await fetchDogadjaj(eventId)
      if (!dogadjaj) return

      await postaviNotifikaciju(
        eventId,
        0, // korisnik koji prijavljuje se ne pamti
        reason,
        reason,
        new Date().toLocaleString('sv-SE'),
        dogadjaj.iD_Kreatora
      )
      dodajULokalnuListu({
        reason,
        eventId,
        eventName: dogadjaj.naslov,
        organizer: 'Neko',
        time: new Date().toLocaleString('sr-RS'),
      })
    })

    connect.start().catch((err) => console.error('SignalR konekcija (notifikacije) nije uspela:', err))
    connectionRef.current = connect

    return () => {
      connect.off('ReceiveNewReaction')
      connect.off('ReceiveNewComment')
      connect.off('ReceiveEventReport')
      connect.stop()
      connectionRef.current = null
    }
  }, [userId, fetchDogadjaj, fetchKorisnik, postaviNotifikaciju, ucitajNotifikacije])

  return (
    <NotificationsContext.Provider value={{ notifications, ucitajNotifikacije }}>
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
