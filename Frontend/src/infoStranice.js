// Sadrzaj informativnih stranica (footer linkovi). Jedno mesto za tekst i rute,
// da Footer i InfoStranica uvek ostanu usaglaseni.

export const KONTAKT_EMAIL = 'kontakt@eventbox.rs' // podesi pravu adresu

export const INFO_STRANICE = [
  {
    slug: 'o-nama',
    putanja: '/o-nama',
    naslov: 'O nama',
    kratko: 'O nama',
    uvod: 'EventBox je drustvena mreza za pronalazenje i organizovanje dogadjaja.',
    sekcije: [
      {
        naslov: 'Sta je EventBox',
        tekst: [
          'Na jednom mestu mozes da objavis svoj dogadjaj, otkrijes sta se desava oko tebe i vidis ko od ljudi dolazi. Od zurki i koncerata, preko sportskih dogadjaja, do humanitarnih i ekoloskih akcija.',
        ],
      },
      {
        naslov: 'Sta mozes da radis',
        lista: [
          'Kreiras dogadjaje sa opisom, slikom, datumom, vremenom i lokacijom na mapi.',
          'Reagujes na dogadjaje: zainteresovan sam, mozda ili nisam zainteresovan.',
          'Komentaris objave i pratis sta drugi pisu.',
          'Saljes poruke drugim korisnicima i dogovaras dolazak.',
          'Pretrazujes dogadjaje po datumu i nazivu, a korisnike po imenu.',
        ],
      },
      {
        naslov: 'Nasa ideja',
        tekst: [
          'Verujemo da su najbolji dogadjaji oni na koje dolaze ljudi koji se poznaju ili tek treba da se upoznaju. EventBox postoji da im u tome olaksa.',
        ],
      },
    ],
  },
  {
    slug: 'pravila-zajednice',
    putanja: '/pravila-zajednice',
    naslov: 'Pravila zajednice',
    kratko: 'Pravila zajednice',
    uvod: 'Da bi EventBox ostao prijatno mesto za sve, molimo te da postujes sledeca pravila.',
    sekcije: [
      {
        naslov: 'Postuj druge',
        lista: [
          'Ponasaj se prema drugima onako kako zelis da se oni ponasaju prema tebi.',
          'Nema uznemiravanja, pretnji, vredjanja ni govora mrznje.',
          'Ne predstavljaj se kao neko drugi.',
        ],
      },
      {
        naslov: 'Sadrzaj koji nije dozvoljen',
        lista: [
          'Nasilje i pozivanje na nasilje, terorizam.',
          'Nezakonit, uvredljiv ili neprimeren sadrzaj.',
          'Lazne informacije i obmanjujuci dogadjaji.',
          'Neovlasceno koriscenje tudjih fotografija i autorskih dela.',
        ],
      },
      {
        naslov: 'Dogadjaji',
        tekst: [
          'Podaci o dogadjaju (naziv, datum, vreme i lokacija) treba da budu tacni. Organizator je odgovoran za dogadjaj koji objavi.',
        ],
      },
      {
        naslov: 'Prijavljivanje',
        tekst: [
          'Ako naidjes na objavu koja krsi pravila, iskoristi opciju "Prijavi objavu" ispod nje i izaberi razlog. Administratori pregledaju svaku prijavu.',
        ],
      },
      {
        naslov: 'Posledice krsenja pravila',
        tekst: [
          'Sadrzaj koji krsi pravila moze biti uklonjen, a nalog privremeno ili trajno blokiran, u zavisnosti od ozbiljnosti prekrsaja.',
        ],
      },
    ],
  },
  {
    slug: 'privatnost',
    putanja: '/privatnost',
    naslov: 'Politika privatnosti',
    kratko: 'Politika privatnosti',
    uvod: 'Ovde objasnjavamo koje podatke prikupljamo i zasto.',
    sekcije: [
      {
        naslov: 'Koje podatke prikupljamo',
        lista: [
          'Podaci o nalogu: ime, prezime, korisnicko ime, email adresa i datum rodjenja.',
          'Profilna slika, ako je dodas.',
          'Sadrzaj koji objavljujes: dogadjaji, slike, komentari, reakcije i poruke.',
        ],
      },
      {
        naslov: 'Kako koristimo podatke',
        lista: [
          'Za prijavu na nalog i rad aplikacije.',
          'Za prikaz tvog profila, dogadjaja i komentara drugim korisnicima.',
          'Za slanje obavestenja o reakcijama, komentarima i porukama.',
          'Za prepoznavanje i uklanjanje sadrzaja koji krsi pravila zajednice.',
        ],
      },
      {
        naslov: 'Ko vidi tvoje podatke',
        tekst: [
          'Ime, korisnicko ime, profilna slika i tvoji dogadjaji vidljivi su drugim korisnicima. Poruke vide samo ucesnici razgovora. Tvoje podatke ne prodajemo trecim stranama.',
        ],
      },
      {
        naslov: 'Kolacici',
        tekst: [
          'Koristimo samo kolacice potrebne za prijavu (token i identifikator korisnika). Brisu se pri odjavi.',
        ],
      },
      {
        naslov: 'Spoljni servisi',
        tekst: [
          'Za prikaz mapa koristimo Google Maps. Njihovo koriscenje podleze Google-ovim uslovima i politici privatnosti.',
        ],
      },
      {
        naslov: 'Tvoja prava',
        tekst: [
          'Svoje dogadjaje, komentare i profilnu sliku mozes da obrises u bilo kom trenutku. Za izmenu ili brisanje naloga obrati nam se putem stranice Kontakt.',
        ],
      },
    ],
  },
  {
    slug: 'uslovi',
    putanja: '/uslovi',
    naslov: 'Uslovi koriscenja',
    kratko: 'Uslovi koriscenja',
    uvod: 'Koriscenjem EventBox-a prihvatas sledece uslove.',
    sekcije: [
      {
        naslov: 'Nalog',
        lista: [
          'Odgovoran si za tacnost podataka koje unosis i za bezbednost svoje lozinke.',
          'Nalog je licni i ne sme se ustupati drugima.',
        ],
      },
      {
        naslov: 'Sadrzaj',
        tekst: [
          'Ti si odgovoran za sadrzaj koji objavljujes. Objavljivanjem dozvoljavas da se on prikazuje na EventBox-u drugim korisnicima. Sadrzaj mora biti u skladu sa pravilima zajednice.',
        ],
      },
      {
        naslov: 'Dogadjaji',
        tekst: [
          'EventBox je platforma za objavljivanje i pronalazenje dogadjaja, a nije organizator dogadjaja. Za sadrzaj, odrzavanje i bezbednost dogadjaja odgovoran je njegov organizator.',
        ],
      },
      {
        naslov: 'Zabranjena upotreba',
        lista: [
          'Pokusaji neovlascenog pristupa tudjim nalozima ili sistemu.',
          'Masovno slanje nezeljenih poruka i oglasa.',
          'Bilo koja upotreba koja narusava zakon ili prava drugih.',
        ],
      },
      {
        naslov: 'Dostupnost i izmene',
        tekst: [
          'Trudimo se da servis radi bez prekida, ali to ne mozemo da garantujemo. Uslove mozemo da menjamo, a o znacajnim izmenama obavestavamo korisnike.',
        ],
      },
      {
        naslov: 'Prestanak koriscenja',
        tekst: [
          'Nalog koji krsi uslove ili pravila zajednice moze biti blokiran. Takodje, u bilo kom trenutku mozes da prestanes da koristis servis.',
        ],
      },
    ],
  },
  {
    slug: 'kontakt',
    putanja: '/kontakt',
    naslov: 'Kontakt',
    kratko: 'Kontakt',
    uvod: 'Imas pitanje, predlog ili problem? Javi nam se.',
    kontakt: true,
    sekcije: [
      {
        naslov: 'Prijava neprimerenog sadrzaja',
        tekst: [
          'Najbrze je da iskoristis opciju "Prijavi objavu" ispod same objave. Administratori je dobijaju odmah.',
        ],
      },
      {
        naslov: 'Pitanja o nalogu i privatnosti',
        tekst: [
          'Za izmenu ili brisanje naloga, kao i sva pitanja o podacima, posalji nam email. Trudimo se da odgovorimo u roku od nekoliko radnih dana.',
        ],
      },
    ],
  },
]
