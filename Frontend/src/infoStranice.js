// Sadrzaj informativnih stranica (footer linkovi). Jedno mesto za tekst i rute,
// da Footer i InfoPage uvek ostanu usaglaseni. Tekst je na oba jezika (en / sr);
// infoSadrzaj(stranica, jezik) vraca verziju za izabrani jezik.

export const KONTAKT_EMAIL = 'kontakt@eventbox.rs' // podesi pravu adresu

export const infoSadrzaj = (stranica, jezik) => stranica[jezik] ?? stranica.en

export const INFO_STRANICE = [
  {
    slug: 'o-nama',
    putanja: '/o-nama',
    en: {
      naslov: 'About us',
      kratko: 'About us',
      uvod: 'EventBox is a social network for finding and organizing events.',
      sekcije: [
        {
          naslov: 'What is EventBox',
          tekst: [
            'In one place you can publish your event, discover what is happening around you and see who is coming. From parties and concerts, through sports events, to charity and eco actions.',
          ],
        },
        {
          naslov: 'What you can do',
          lista: [
            'Create events with a description, image, date, time and a location on the map.',
            'React to events: interested, maybe or not interested.',
            'Comment on posts and follow what others write.',
            'Send messages to other users and arrange to meet.',
            'Search events by date and title, and users by name.',
          ],
        },
        {
          naslov: 'Our idea',
          tekst: [
            'We believe the best events are the ones attended by people who know each other or are about to meet. EventBox exists to make that easier.',
          ],
        },
      ],
    },
    sr: {
      naslov: 'O nama',
      kratko: 'O nama',
      uvod: 'EventBox je društvena mreža za pronalaženje i organizovanje događaja.',
      sekcije: [
        {
          naslov: 'Šta je EventBox',
          tekst: [
            'Na jednom mestu možeš da objaviš svoj događaj, otkriješ šta se dešava oko tebe i vidiš ko od ljudi dolazi. Od žurki i koncerata, preko sportskih događaja, do humanitarnih i ekoloških akcija.',
          ],
        },
        {
          naslov: 'Šta možeš da radiš',
          lista: [
            'Kreiraš događaje sa opisom, slikom, datumom, vremenom i lokacijom na mapi.',
            'Reaguješ na događaje: zainteresovan sam, možda ili nisam zainteresovan.',
            'Komentarišeš objave i pratiš šta drugi pišu.',
            'Šalješ poruke drugim korisnicima i dogovaraš dolazak.',
            'Pretražuješ događaje po datumu i nazivu, a korisnike po imenu.',
          ],
        },
        {
          naslov: 'Naša ideja',
          tekst: [
            'Verujemo da su najbolji događaji oni na koje dolaze ljudi koji se poznaju ili tek treba da se upoznaju. EventBox postoji da im u tome olakša.',
          ],
        },
      ],
    },
  },
  {
    slug: 'pravila-zajednice',
    putanja: '/pravila-zajednice',
    en: {
      naslov: 'Community rules',
      kratko: 'Community rules',
      uvod: 'To keep EventBox a pleasant place for everyone, please follow these rules.',
      sekcije: [
        {
          naslov: 'Respect others',
          lista: [
            'Treat others the way you want them to treat you.',
            'No harassment, threats, insults or hate speech.',
            'Do not pretend to be someone else.',
          ],
        },
        {
          naslov: 'Content that is not allowed',
          lista: [
            'Violence, calls to violence and terrorism.',
            'Illegal, offensive or inappropriate content.',
            'False information and misleading events.',
            'Using other people\'s photos and copyrighted work without permission.',
          ],
        },
        {
          naslov: 'Events',
          tekst: [
            'Event details (title, date, time and location) must be accurate. The organizer is responsible for the event they publish.',
          ],
        },
        {
          naslov: 'Reporting',
          tekst: [
            'If you come across a post that breaks the rules, use the "Report post" option below it and choose a reason. Administrators review every report.',
          ],
        },
        {
          naslov: 'Consequences of breaking the rules',
          tekst: [
            'Content that breaks the rules can be removed, and the account can be blocked temporarily or permanently, depending on how serious the violation is.',
          ],
        },
      ],
    },
    sr: {
      naslov: 'Pravila zajednice',
      kratko: 'Pravila zajednice',
      uvod: 'Da bi EventBox ostao prijatno mesto za sve, molimo te da poštuješ sledeća pravila.',
      sekcije: [
        {
          naslov: 'Poštuj druge',
          lista: [
            'Ponašaj se prema drugima onako kako želiš da se oni ponašaju prema tebi.',
            'Nema uznemiravanja, pretnji, vređanja ni govora mržnje.',
            'Ne predstavljaj se kao neko drugi.',
          ],
        },
        {
          naslov: 'Sadržaj koji nije dozvoljen',
          lista: [
            'Nasilje i pozivanje na nasilje, terorizam.',
            'Nezakonit, uvredljiv ili neprimeren sadržaj.',
            'Lažne informacije i obmanjujući događaji.',
            'Neovlašćeno korišćenje tuđih fotografija i autorskih dela.',
          ],
        },
        {
          naslov: 'Događaji',
          tekst: [
            'Podaci o događaju (naziv, datum, vreme i lokacija) treba da budu tačni. Organizator je odgovoran za događaj koji objavi.',
          ],
        },
        {
          naslov: 'Prijavljivanje',
          tekst: [
            'Ako naiđeš na objavu koja krši pravila, iskoristi opciju "Prijavi objavu" ispod nje i izaberi razlog. Administratori pregledaju svaku prijavu.',
          ],
        },
        {
          naslov: 'Posledice kršenja pravila',
          tekst: [
            'Sadržaj koji krši pravila može biti uklonjen, a nalog privremeno ili trajno blokiran, u zavisnosti od ozbiljnosti prekršaja.',
          ],
        },
      ],
    },
  },
  {
    slug: 'privatnost',
    putanja: '/privatnost',
    en: {
      naslov: 'Privacy policy',
      kratko: 'Privacy policy',
      uvod: 'Here we explain which data we collect and why.',
      sekcije: [
        {
          naslov: 'Data we collect',
          lista: [
            'Account details: first name, last name, username, email address and date of birth.',
            'Your profile picture, if you add one.',
            'Content you publish: events, images, comments, reactions and messages.',
          ],
        },
        {
          naslov: 'How we use the data',
          lista: [
            'To log you in and run the application.',
            'To show your profile, events and comments to other users.',
            'To send notifications about reactions, comments and messages.',
            'To detect and remove content that breaks the community rules.',
          ],
        },
        {
          naslov: 'Who sees your data',
          tekst: [
            'Your name, username, profile picture and events are visible to other users. Messages are seen only by the people in the conversation. We do not sell your data to third parties.',
          ],
        },
        {
          naslov: 'Cookies',
          tekst: [
            'We only use the cookies needed to log in (a token and a user identifier). They are deleted when you log out. Your language choice is saved in the browser.',
          ],
        },
        {
          naslov: 'External services',
          tekst: [
            'We use Google Maps to show maps. Its use is subject to Google\'s terms and privacy policy.',
          ],
        },
        {
          naslov: 'Your rights',
          tekst: [
            'You can delete your events, comments and profile picture at any time. To change or delete your account, contact us through the Contact page.',
          ],
        },
      ],
    },
    sr: {
      naslov: 'Politika privatnosti',
      kratko: 'Politika privatnosti',
      uvod: 'Ovde objašnjavamo koje podatke prikupljamo i zašto.',
      sekcije: [
        {
          naslov: 'Koje podatke prikupljamo',
          lista: [
            'Podaci o nalogu: ime, prezime, korisničko ime, email adresa i datum rođenja.',
            'Profilna slika, ako je dodaš.',
            'Sadržaj koji objavljuješ: događaji, slike, komentari, reakcije i poruke.',
          ],
        },
        {
          naslov: 'Kako koristimo podatke',
          lista: [
            'Za prijavu na nalog i rad aplikacije.',
            'Za prikaz tvog profila, događaja i komentara drugim korisnicima.',
            'Za slanje obaveštenja o reakcijama, komentarima i porukama.',
            'Za prepoznavanje i uklanjanje sadržaja koji krši pravila zajednice.',
          ],
        },
        {
          naslov: 'Ko vidi tvoje podatke',
          tekst: [
            'Ime, korisničko ime, profilna slika i tvoji događaji vidljivi su drugim korisnicima. Poruke vide samo učesnici razgovora. Tvoje podatke ne prodajemo trećim stranama.',
          ],
        },
        {
          naslov: 'Kolačići',
          tekst: [
            'Koristimo samo kolačiće potrebne za prijavu (token i identifikator korisnika). Brišu se pri odjavi. Izabrani jezik se pamti u browseru.',
          ],
        },
        {
          naslov: 'Spoljni servisi',
          tekst: [
            'Za prikaz mapa koristimo Google Maps. Njihovo korišćenje podleže Google-ovim uslovima i politici privatnosti.',
          ],
        },
        {
          naslov: 'Tvoja prava',
          tekst: [
            'Svoje događaje, komentare i profilnu sliku možeš da obrišeš u bilo kom trenutku. Za izmenu ili brisanje naloga obrati nam se putem stranice Kontakt.',
          ],
        },
      ],
    },
  },
  {
    slug: 'uslovi',
    putanja: '/uslovi',
    en: {
      naslov: 'Terms of use',
      kratko: 'Terms of use',
      uvod: 'By using EventBox you accept the following terms.',
      sekcije: [
        {
          naslov: 'Account',
          lista: [
            'You are responsible for the accuracy of the data you enter and for keeping your password safe.',
            'Your account is personal and must not be shared with others.',
          ],
        },
        {
          naslov: 'Content',
          tekst: [
            'You are responsible for the content you publish. By publishing it, you allow it to be shown to other users on EventBox. Content must follow the community rules.',
          ],
        },
        {
          naslov: 'Events',
          tekst: [
            'EventBox is a platform for publishing and finding events, not an event organizer. The organizer is responsible for the content, running and safety of the event.',
          ],
        },
        {
          naslov: 'Prohibited use',
          lista: [
            'Attempts to gain unauthorized access to other accounts or the system.',
            'Mass sending of unwanted messages and ads.',
            'Any use that breaks the law or the rights of others.',
          ],
        },
        {
          naslov: 'Availability and changes',
          tekst: [
            'We do our best to keep the service running without interruptions, but we cannot guarantee it. We may change these terms and will inform users about significant changes.',
          ],
        },
        {
          naslov: 'Ending use',
          tekst: [
            'An account that breaks the terms or the community rules can be blocked. You can also stop using the service at any time.',
          ],
        },
      ],
    },
    sr: {
      naslov: 'Uslovi korišćenja',
      kratko: 'Uslovi korišćenja',
      uvod: 'Korišćenjem EventBox-a prihvataš sledeće uslove.',
      sekcije: [
        {
          naslov: 'Nalog',
          lista: [
            'Odgovoran si za tačnost podataka koje unosiš i za bezbednost svoje lozinke.',
            'Nalog je lični i ne sme se ustupati drugima.',
          ],
        },
        {
          naslov: 'Sadržaj',
          tekst: [
            'Ti si odgovoran za sadržaj koji objavljuješ. Objavljivanjem dozvoljavaš da se on prikazuje na EventBox-u drugim korisnicima. Sadržaj mora biti u skladu sa pravilima zajednice.',
          ],
        },
        {
          naslov: 'Događaji',
          tekst: [
            'EventBox je platforma za objavljivanje i pronalaženje događaja, a nije organizator događaja. Za sadržaj, održavanje i bezbednost događaja odgovoran je njegov organizator.',
          ],
        },
        {
          naslov: 'Zabranjena upotreba',
          lista: [
            'Pokušaji neovlašćenog pristupa tuđim nalozima ili sistemu.',
            'Masovno slanje neželjenih poruka i oglasa.',
            'Bilo koja upotreba koja narušava zakon ili prava drugih.',
          ],
        },
        {
          naslov: 'Dostupnost i izmene',
          tekst: [
            'Trudimo se da servis radi bez prekida, ali to ne možemo da garantujemo. Uslove možemo da menjamo, a o značajnim izmenama obaveštavamo korisnike.',
          ],
        },
        {
          naslov: 'Prestanak korišćenja',
          tekst: [
            'Nalog koji krši uslove ili pravila zajednice može biti blokiran. Takođe, u bilo kom trenutku možeš da prestaneš da koristiš servis.',
          ],
        },
      ],
    },
  },
  {
    slug: 'kontakt',
    putanja: '/kontakt',
    kontakt: true,
    en: {
      naslov: 'Contact',
      kratko: 'Contact',
      uvod: 'Have a question, a suggestion or a problem? Get in touch.',
      sekcije: [
        {
          naslov: 'Reporting inappropriate content',
          tekst: [
            'The fastest way is the "Report post" option below the post itself. Administrators receive it right away.',
          ],
        },
        {
          naslov: 'Questions about your account and privacy',
          tekst: [
            'To change or delete your account, or for any questions about your data, send us an email. We try to reply within a few working days.',
          ],
        },
      ],
    },
    sr: {
      naslov: 'Kontakt',
      kratko: 'Kontakt',
      uvod: 'Imaš pitanje, predlog ili problem? Javi nam se.',
      sekcije: [
        {
          naslov: 'Prijava neprimerenog sadržaja',
          tekst: [
            'Najbrže je da iskoristiš opciju "Prijavi objavu" ispod same objave. Administratori je dobijaju odmah.',
          ],
        },
        {
          naslov: 'Pitanja o nalogu i privatnosti',
          tekst: [
            'Za izmenu ili brisanje naloga, kao i sva pitanja o podacima, pošalji nam email. Trudimo se da odgovorimo u roku od nekoliko radnih dana.',
          ],
        },
      ],
    },
  },
]
