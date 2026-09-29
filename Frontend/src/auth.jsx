// ============================================================================
//  Auth - jedinstvena tacka za "ko je ulogovan"
// ----------------------------------------------------------------------------
//  Pre: ~15 komponenti je direktno zvalo Cookies.get('userID'), login je pisao
//  kolacice rucno, logout se radio na 3 mesta razlicito.
//
//  Sad: <AuthProvider> cita kolacice jednom i izlaze:
//    userId, token, isLoggedIn, login({ token, userId }), logout()
//  Komponente koriste  const { userId } = useAuth().
//
//  Skladiste je i dalje kolacic (js-cookie) - hook je samo sloj pristupa,
//  pa se kasnije lako menja na httpOnly kolacic bez diranja komponenti.
// ============================================================================
import { createContext, useContext, useState, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Cookies from 'js-cookie'

const COOKIE_OPTS = { path: '/' }
// secure -> kolacic se salje samo preko HTTPS-a (automatski false na http://localhost u razvoju,
// true cim se sajt vrti na https:// u produkciji - nema potrebe rucno menjati)
// sameSite: 'strict' -> browser ga ne salje ni na jedan cross-site zahtev
const SET_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  secure: window.location.protocol === 'https:',
  sameSite: 'strict',
}

// Cisti auth kolacice. Koristi ga i logout() i api.js na 401 - da imena
// kljuceva ('token', 'userID') stoje na jednom mestu.
export function clearAuthCookies() {
  Cookies.remove('token', COOKIE_OPTS)
  Cookies.remove('userID', COOKIE_OPTS)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Inicijalno stanje iz kolacica (npr. refresh stranice zadrzava sesiju)
  const [auth, setAuth] = useState(() => ({
    token: Cookies.get('token') || null,
    userId: Cookies.get('userID') || null,
  }))

  const login = useCallback(({ token, userId }) => {
    Cookies.set('token', String(token), SET_COOKIE_OPTS)
    Cookies.set('userID', String(userId), SET_COOKIE_OPTS)
    setAuth({ token: String(token), userId: String(userId) })
  }, [])

  const logout = useCallback(() => {
    clearAuthCookies()
    setAuth({ token: null, userId: null })
  }, [])

  const value = {
    userId: auth.userId,
    token: auth.token,
    isLoggedIn: Boolean(auth.token),
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth mora biti unutar <AuthProvider>')
  }
  return ctx
}

// Kapija za zasticene rute. Ako nema tokena -> redirect na /login PRE nego sto
// se zasticena strana montira (nema bleska UI-ja, nema bacenih zahteva).
// `from` cuva gde je korisnik hteo, da ga login vrati tamo posle prijave.
export function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />
  }
  return children
}
