// ============================================================================
//  Beskonacni skrol za liste sa backenda koje se stranice kursorom
// ----------------------------------------------------------------------------
//  Backend (Models/Pagination.cs) vraca: { stavke, sledeciKursor, imaJos, ukupno }.
//  Ovaj hook ucitava prvu stranu cim se promeni `path` (npr. drugi filter ili profil)
//  i sledecu kad korisnik skrolom stigne blizu kraja liste.
//
//  Upotreba:
//    const lista = useInfiniteList('/api/events', { mapItem });
//    lista.items.map(...)
//    <InfiniteScrollFooter lista={lista} />   // postavlja "cuvara" na dno i prikazuje loader
//
//  - path = null/'' -> nista se ne ucitava
//  - mapItem(stavka) -> dopuna svake stavke posle ucitavanja (npr. formatiran datum)
//  - direction: 'down' (podrazumevano) nove strane se dodaju na kraj; 'up' (cet) backend vraca
//    najnovije prvo, a lista se cuva od starijih ka novijim: starije strane se dodaju na POCETAK
//  - odgovor za staru putanju (korisnik je u medjuvremenu promenio filter) se odbacuje
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

export function useInfiniteList(path, { limit = 3, mapItem, direction = 'down' } = {}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)        // stize samo uz prvu stranu
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true) // prva strana jos nije stigla
  const [error, setError] = useState(null)
  const [sentinel, setSentinel] = useState(null)  // DOM element na dnu liste

  const cursorRef = useRef(null)
  const hasMoreRef = useRef(false)
  const inFlight = useRef(false)        // sprecava dva istovremena zahteva
  const firstPageFailed = useRef(false) // greska je bila na prvoj strani -> "Pokusaj ponovo" je ucitava ispocetka
  const generation = useRef(0)          // raste pri promeni putanje; stari odgovori se ignorisu
  const mapItemRef = useRef(mapItem)
  mapItemRef.current = mapItem

  // Nova putanja: lista se prazni ODMAH u istom renderu (a ne tek u efektu), da se ni na jedan
  // frejm ne vide stavke prethodne putanje (npr. poruke drugog razgovora)
  const [currentPath, setCurrentPath] = useState(path)
  if (currentPath !== path) {
    setCurrentPath(path)
    setItems([])
    setTotal(null)
    setHasMore(false)
    setError(null)
    setInitialLoading(true)
    setLoading(false)
    generation.current += 1 // odgovori za staru putanju se odbacuju
    inFlight.current = false
    cursorRef.current = null
    hasMoreRef.current = false
  }

  const loadPage = useCallback(async (first) => {
    if (!path) return
    if (!first && (inFlight.current || !hasMoreRef.current)) return

    const gen = generation.current
    inFlight.current = true
    setLoading(true)
    setError(null)
    try {
      const sep = path.includes('?') ? '&' : '?'
      const cursor = first ? null : cursorRef.current
      const data = await api.get(
        `${path}${sep}limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
      )
      if (gen !== generation.current) return
      let page = mapItemRef.current ? data.stavke.map(mapItemRef.current) : data.stavke
      if (direction === 'up') page = [...page].reverse()
      cursorRef.current = data.sledeciKursor
      hasMoreRef.current = data.imaJos
      firstPageFailed.current = false
      setItems((prev) => (first ? page : direction === 'up' ? [...page, ...prev] : [...prev, ...page]))
      setHasMore(data.imaJos)
      if (data.ukupno != null) setTotal(data.ukupno)
    } catch (err) {
      if (gen === generation.current) {
        console.error('Greska pri ucitavanju liste:', err)
        firstPageFailed.current = first
        setError(err)
      }
    } finally {
      if (gen === generation.current) {
        inFlight.current = false
        setLoading(false)
        setInitialLoading(false)
      }
    }
  }, [path, limit, direction])

  // Nova putanja -> sve ispocetka
  useEffect(() => {
    generation.current += 1
    inFlight.current = false
    cursorRef.current = null
    hasMoreRef.current = false
    setItems([])
    setTotal(null)
    setHasMore(false)
    setError(null)
    setInitialLoading(true)
    setLoading(false)
    if (path) loadPage(true)
  }, [path, loadPage])

  // Kad "cuvar" na dnu liste udje u vidno polje (ili 400px pre toga), ucitaj sledecu stranu.
  // Efekat se ponovo pravi posle svake ucitane strane: novi observer odmah javi da li je cuvar
  // jos vidljiv (kratka lista na velikom ekranu), pa se ucitava dok se ekran ne popuni.
  // Posle greske se ne ucitava samo od sebe - inace bi beskonacno ponavljao neuspeo zahtev.
  useEffect(() => {
    if (!sentinel || !hasMore || loading || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadPage(false)
      },
      { rootMargin: '400px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, hasMore, loading, error, loadPage])

  const loadMore = useCallback(() => loadPage(firstPageFailed.current), [loadPage])

  return {
    items,
    setItems,   // za lokalne izmene (brisanje, nova stavka na vrh)
    total,
    setTotal,
    hasMore,
    loading,
    initialLoading,
    error,
    loadMore,
    sentinelRef: setSentinel, // ref za element na dnu liste (vidi InfiniteScrollFooter)
  }
}
