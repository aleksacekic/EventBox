// Centralna tacka za adresu backenda.
//
// Pre: "http://localhost:5153" je bilo hardkodirano na ~89 mesta. Menjanje porta
// ili deploy na server znacilo je find-replace kroz ceo src/. Sad je na jednom mestu.
//
// Vite ubacuje samo env varijable sa prefiksom VITE_ (vidi .env). Ako .env ne
// postoji, pada na lokalni default da `npm run dev` radi bez ikakvog setup-a.
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5153'

// Tanak wrapper oko fetch-a: sklapa URL, salje/parsira JSON, baca na ne-2xx.
// Namerno minimalan - Faza 2 ovde dodaje Authorization header i 401 handling.
export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json', ...options.headers }
      : options.headers,
    ...options,
  })
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} - ${url}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// Za <img src>, SignalR .withUrl() i sl. gde treba samo string.
export const resourceUrl = (path = '') => `${API_BASE}${path}`
