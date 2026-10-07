// ============================================================================
//  Beskonacni skrol za liste sa backenda koje se stranice kursorom
// ----------------------------------------------------------------------------
//  Backend (Models/Paginacija.cs) vraca: { stavke, sledeciKursor, imaJos, ukupno }.
//  Ovaj hook ucitava prvu stranu cim se promeni `putanja` (npr. drugi filter ili profil)
//  i sledecu kad korisnik skrolom stigne blizu kraja liste.
//
//  Upotreba:
//    const lista = useBeskonacnaLista('/Dogadjaj/VratiDogadjajeZaHomePage', { mapiraj });
//    lista.stavke.map(...)
//    <KrajListe lista={lista} />        // postavlja "cuvara" na dno i prikazuje loader
//
//  - putanja = null/'' -> nista se ne ucitava
//  - mapiraj(stavka) -> dopuna svake stavke posle ucitavanja (npr. formatiran datum)
//  - odgovor za staru putanju (korisnik je u medjuvremenu promenio filter) se odbacuje
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

export function useBeskonacnaLista(putanja, { limit = 3, mapiraj } = {}) {
  const [stavke, setStavke] = useState([])
  const [ukupno, setUkupno] = useState(null)   // stize samo uz prvu stranu
  const [imaJos, setImaJos] = useState(false)
  const [ucitava, setUcitava] = useState(false)
  const [pocetno, setPocetno] = useState(true) // prva strana jos nije stigla
  const [greska, setGreska] = useState(null)
  const [cuvar, setCuvar] = useState(null)     // DOM element na dnu liste

  const kursorRef = useRef(null)
  const imaJosRef = useRef(false)
  const uToku = useRef(false)      // sprecava dva istovremena zahteva
  const prvaNeuspela = useRef(false) // greska je bila na prvoj strani -> "Pokusaj ponovo" je ucitava ispocetka
  const generacija = useRef(0)     // raste pri promeni putanje; stari odgovori se ignorisu
  const mapirajRef = useRef(mapiraj)
  mapirajRef.current = mapiraj

  const ucitajStranu = useCallback(async (prva) => {
    if (!putanja) return
    if (!prva && (uToku.current || !imaJosRef.current)) return

    const gen = generacija.current
    uToku.current = true
    setUcitava(true)
    setGreska(null)
    try {
      const sep = putanja.includes('?') ? '&' : '?'
      const kursor = prva ? null : kursorRef.current
      const data = await api.get(
        `${putanja}${sep}limit=${limit}${kursor ? `&cursor=${encodeURIComponent(kursor)}` : ''}`
      )
      if (gen !== generacija.current) return
      const nove = mapirajRef.current ? data.stavke.map(mapirajRef.current) : data.stavke
      kursorRef.current = data.sledeciKursor
      imaJosRef.current = data.imaJos
      prvaNeuspela.current = false
      setStavke((prev) => (prva ? nove : [...prev, ...nove]))
      setImaJos(data.imaJos)
      if (data.ukupno != null) setUkupno(data.ukupno)
    } catch (error) {
      if (gen === generacija.current) {
        console.error('Greska pri ucitavanju liste:', error)
        prvaNeuspela.current = prva
        setGreska(error)
      }
    } finally {
      if (gen === generacija.current) {
        uToku.current = false
        setUcitava(false)
        setPocetno(false)
      }
    }
  }, [putanja, limit])

  // Nova putanja -> sve ispocetka
  useEffect(() => {
    generacija.current += 1
    uToku.current = false
    kursorRef.current = null
    imaJosRef.current = false
    setStavke([])
    setUkupno(null)
    setImaJos(false)
    setGreska(null)
    setPocetno(true)
    setUcitava(false)
    if (putanja) ucitajStranu(true)
  }, [putanja, ucitajStranu])

  // Kad "cuvar" na dnu liste udje u vidno polje (ili 400px pre toga), ucitaj sledecu stranu.
  // Efekat se ponovo pravi posle svake ucitane strane: novi observer odmah javi da li je cuvar
  // jos vidljiv (kratka lista na velikom ekranu), pa se ucitava dok se ekran ne popuni.
  // Posle greske se ne ucitava samo od sebe - inace bi beskonacno ponavljao neuspeo zahtev.
  useEffect(() => {
    if (!cuvar || !imaJos || ucitava || greska) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) ucitajStranu(false)
      },
      { rootMargin: '400px' }
    )
    observer.observe(cuvar)
    return () => observer.disconnect()
  }, [cuvar, imaJos, ucitava, greska, ucitajStranu])

  const ucitajJos = useCallback(() => ucitajStranu(prvaNeuspela.current), [ucitajStranu])

  return {
    stavke,
    setStavke,   // za lokalne izmene (brisanje, nova stavka na vrh)
    ukupno,
    setUkupno,
    imaJos,
    ucitava,
    pocetno,
    greska,
    ucitajJos,
    cuvarRef: setCuvar, // ref za element na dnu liste (vidi KrajListe)
  }
}
