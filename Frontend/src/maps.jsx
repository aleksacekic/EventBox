import { APIProvider } from '@vis.gl/react-google-maps'

// Google Maps kljuc iz .env (VITE_GOOGLE_MAPS_API_KEY). Montiran jednom u
// App.jsx (isti obrazac kao AuthProvider/NotificationsProvider), pa svaka
// komponenta ispod (Mapa.jsx, Hide&ShowMapa.jsx) samo koristi <Map>/<AdvancedMarker>
// bez da sama brine o ucitavanju skripte.
//
// Bez pravog kljuca mapa i dalje radi (klik, marker...), samo Google preko
// plocica ispisuje "For development purposes only" - dovoljno za razvoj.
export function GoogleMapsProvider({ children }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  return <APIProvider apiKey={apiKey}>{children}</APIProvider>
}
