// ============================================================================
//  Centralni API klijent
// ----------------------------------------------------------------------------
//  Pre: ~68 golih fetch() poziva razbacanih po komponentama, svaki sa svojom
//  varijantom .then(res => res.json()) / obrade gresaka / 401 handlinga.
//
//  Sad: sve ide kroz `api.get/post/put/del`. Na jednom mestu:
//    - lepi se API_BASE (adresa backenda iz .env)
//    - kaci se Authorization token (iz kolacica 'token')
//    - 401  -> brise auth kolacice i vraca na /login
//    - ne-2xx -> baca ApiError sa statusom i porukom
//    - telo se serijalizuje/parsira (JSON ili FormData)
// ============================================================================
import Cookies from 'js-cookie'
import { clearAuthCookies } from './auth'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5153'

// Za <img src>, SignalR .withUrl() i sl. gde treba samo string, ne fetch.
export const resourceUrl = (path = '') => `${API_BASE}${path}`

export class ApiError extends Error {
  constructor(status, message, url) {
    super(typeof message === 'string' && message ? message : `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.url = url
  }
}

function parseMaybeJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text // backend ponekad vrati goli string
  }
}

async function request(method, path, { body, headers, ...rest } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const token = Cookies.get('token')
  const isForm = body instanceof FormData

  const res = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body != null && !isForm ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body == null ? undefined : isForm ? body : JSON.stringify(body),
    ...rest,
  })

  // Token istekao / nevalidan -> nazad na login (jedno mesto umesto po komponentama)
  if (res.status === 401) {
    clearAuthCookies()
    if (window.location.pathname !== '/') window.location.assign('/')
    throw new ApiError(401, 'Neautorizovano - prijavite se ponovo', url)
  }

  const data = parseMaybeJson(await res.text())

  if (!res.ok) {
    const msg = (data && (data.message || data.title)) || (typeof data === 'string' ? data : res.statusText)
    throw new ApiError(res.status, msg, url)
  }

  return data
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, body, opts) => request('POST', path, { body, ...opts }),
  put: (path, body, opts) => request('PUT', path, { body, ...opts }),
  del: (path, opts) => request('DELETE', path, opts),
  request,
}

// ---------------------------------------------------------------------------
//  Prelazni sloj: stari `apiFetch` zadrzan dok se sve komponente ne prebace
//  na `api.*`. Nove pozive NE pisati preko ovoga.
// ---------------------------------------------------------------------------
export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  return request(method, path, options)
}
