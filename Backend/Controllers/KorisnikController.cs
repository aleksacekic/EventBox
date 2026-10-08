using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;
using System.Security.Cryptography;
using System.Text;

namespace EventBoxApi.Controllers
{

    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class KorisnikController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        public IFileService _fileService;
        private readonly Obavestenja _obavestenja;
        private readonly ZastitaPrijave _zastita;


        public KorisnikController(EventBoxContext context, IFileService fs, Obavestenja obavestenja, ZastitaPrijave zastita)
        {
            Context = context;
            this._fileService = fs;
            _obavestenja = obavestenja;
            _zastita = zastita;
        }


        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(ZastitaPrijave.PolitikaRegistracija)]
        [Route("DodajKorisnika")]
        [HttpPost]
        public async Task<ActionResult> DodajKorisnika([FromBody] RegistracijaZahtev zahtev)
        {
            if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.Ime) || string.IsNullOrWhiteSpace(zahtev.Prezime)
                || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme) || string.IsNullOrWhiteSpace(zahtev.EmailAdresa)
                || string.IsNullOrEmpty(zahtev.Lozinka) || zahtev.Lozinka.Length < 8)
                return BadRequest("Sva polja su obavezna, a lozinka mora imati najmanje 8 karaktera");

            zahtev.KorisnickoIme = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
            var greskaImena = KorisnickoIme.Proveri(zahtev.KorisnickoIme);
            if (greskaImena != null)
                return BadRequest(greskaImena);

            zahtev.EmailAdresa = EmailAdresa.Normalizuj(zahtev.EmailAdresa);
            if (EmailAdresa.Proveri(zahtev.EmailAdresa) is string greskaEmaila)
                return BadRequest(greskaEmaila);

            // Datum rodjenja mora biti izmedju 1900. i danas
            if (zahtev.DatumRodjenja < new DateTime(1900, 1, 1) || zahtev.DatumRodjenja > DateTime.Today)
                return Ok(new {odgovor = "DATUM"});

            var pom = await Context.Korisnici.Where(p => p.Korisnicko_Ime == zahtev.KorisnickoIme).FirstOrDefaultAsync();
            if(pom != null)
                return Ok(new {odgovor = "KORISNICKO_IME"});
            if (await Context.Korisnici.AnyAsync(p => p.Email_Adresa == zahtev.EmailAdresa))
                return Ok(new {odgovor = "EMAIL"});

            Korisnik k = new Korisnik();
            k.Ime = zahtev.Ime;
            k.Prezime = zahtev.Prezime;
            k.Korisnicko_Ime = zahtev.KorisnickoIme;
            k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);
            k.Token = NoviToken();
            k.Validnost = DateTime.UtcNow.AddMinutes(10);
            k.Datum_rodjenja = zahtev.DatumRodjenja;
            k.Email_Adresa = zahtev.EmailAdresa;
            k.KorisnikImage = null;
            k.Blokiran = 0;

            Context.Korisnici.Add(k);
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (EmailAdresa.JeDuplikat(e))
            {
                return Ok(new {odgovor = "EMAIL"});
            }
            catch (DbUpdateException e) when (KorisnickoIme.JeDuplikat(e))
            {
                // Neko je isto ime zauzeo izmedju provere gore i upisa
                return Ok(new {odgovor = "KORISNICKO_IME"});
            }
            return Ok("Uspesno je upisan korisnik sa korisnickim imenom " + zahtev.KorisnickoIme);
        }

        [EnableCors("CORS")]
        [Route("IzbrisiKorisnika/{id}")]
        [HttpDelete]
        public async Task<ActionResult> IzbrisiKorisnika(int id, [FromBody] BrisanjeNalogaZahtev? zahtev)
        {
            if (id != User.IdKorisnika())
                return Forbid(); // nalog brise samo njegov vlasnik
            var korisnik = await Context.Korisnici.FindAsync(id);
            if (korisnik == null)
                return NotFound();
            // Nepovratno - trazi se i lozinka, ne samo token (npr. otkljucan tudji racunar)
            var greskaLozinke = ProveriLozinku(korisnik, zahtev?.Lozinka, "lozinka");
            if (greskaLozinke != null)
                return greskaLozinke;
            // Slike na disku: profilna i slike njegovih dogadjaja (brisu se posle uspesnog brisanja iz baze)
            var slike = await Context.Dogadjaji.Where(d => d.ID_Kreatora == id && d.DogadjajImage != null)
                .Select(d => d.DogadjajImage).ToListAsync();
            slike.Add(korisnik.KorisnikImage);
            // Komentari na tudjim dogadjajima nemaju kaskadu u bazi (vidi EventBoxContext);
            // oni na sopstvenim dogadjajima se brisu kaskadno zajedno sa dogadjajima
            Context.Komentari.RemoveRange(Context.Komentari.Where(k => k.AutorId == id));
            // Isto za reakcije; posle brisanja se brojaci tih tudjih dogadjaja ponovo racunaju
            var reagovaoNa = await Context.Reakcije
                .Where(r => r.Korisnik_ID == id && r.Dogadjaj_ID.ID_Kreatora != id)
                .Select(r => r.Dogadjaj_ID.Id)
                .ToArrayAsync();
            Context.Reakcije.RemoveRange(Context.Reakcije.Where(r => r.Korisnik_ID == id));
            // Poruke (poslate i primljene) i notifikacije koje je izazvao na tudjim objavama
            // Njegove prijave ostaju (moderaciji treba razlog), samo gube podatak ko je prijavio
            foreach (var razlog in await Context.Razlozi.Where(r => r.PrijavioId == id).ToListAsync())
                razlog.PrijavioId = null;
            Context.Poruke.RemoveRange(Context.Poruke.Where(m => m.PosiljaocId == id || m.PrimaocId == id));
            var uklonjene = await _obavestenja.UkloniAsync(Context.Notifikacije.Where(n => n.KorisnikKojiReagujeId == id));
            Context.Korisnici.Remove(korisnik);
            await Context.SaveChangesAsync();
            await BrojaciReakcija.OsveziAsync(Context, reagovaoNa);
            await _obavestenja.JaviUklonjeneAsync(uklonjene); // vlasnicima tih objava nestaju uzivo
            slike.ForEach(_fileService.ObrisiSliku);
            return Ok("Uspesno je obrisan korisnik sa id-em " + id);
        }
        
        // Izmena podataka ulogovanog korisnika. Neispravan unos -> 400 { message, greske: { polje: poruka } }
        // (polja: ime, prezime, korisnickoIme, emailAdresa, datumRodjenja, lozinka, trenutnaLozinka).
        // Nova lozinka trazi i trenutnu. Uspeh -> javni podaci korisnika (KorisnikJavniDto).
        [EnableCors("CORS")]
        [Route("IzmeniKorisnika")]
        [HttpPut]
        public async Task<ActionResult> IzmeniKorisnika([FromBody] IzmenaKorisnikaZahtev zahtev)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(User.IdKorisnika());
            if (k == null)
                return Forbid(); // administrator nema korisnicki profil
            if (zahtev == null)
                return BadRequest("Nedostaju podaci");

            var greske = new Dictionary<string, string>();
            zahtev.Ime = zahtev.Ime?.Trim() ?? "";
            zahtev.Prezime = zahtev.Prezime?.Trim() ?? "";
            zahtev.EmailAdresa = EmailAdresa.Normalizuj(zahtev.EmailAdresa);
            if (zahtev.Ime.Length is < 1 or > 50) greske["ime"] = "Ime mora imati od 1 do 50 karaktera.";
            if (zahtev.Prezime.Length is < 1 or > 50) greske["prezime"] = "Prezime mora imati od 1 do 50 karaktera.";
            zahtev.KorisnickoIme = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
            if (KorisnickoIme.Proveri(zahtev.KorisnickoIme) is string greskaImena) greske["korisnickoIme"] = greskaImena;
            if (EmailAdresa.Proveri(zahtev.EmailAdresa) is string greskaEmaila)
                greske["emailAdresa"] = greskaEmaila;
            if (zahtev.DatumRodjenja < new DateTime(1900, 1, 1) || zahtev.DatumRodjenja > DateTime.Today)
                greske["datumRodjenja"] = "Datum rodjenja nije ispravan.";
            if (!string.IsNullOrEmpty(zahtev.Lozinka) && zahtev.Lozinka.Length < 8)
                greske["lozinka"] = "Nova lozinka mora imati najmanje 8 karaktera.";
            if (greske.Count > 0)
                return BadRequest(new { message = "Proverite unete podatke.", greske });

            if (!string.IsNullOrEmpty(zahtev.Lozinka))
            {
                var greskaLozinke = ProveriLozinku(k, zahtev.TrenutnaLozinka, "trenutnaLozinka");
                if (greskaLozinke != null)
                    return greskaLozinke;
                k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);
            }

            if (k.Korisnicko_Ime != zahtev.KorisnickoIme &&
                await Context.Korisnici.AnyAsync(p => p.Korisnicko_Ime == zahtev.KorisnickoIme))
                return ImeZauzeto();
            if (await Context.Korisnici.AnyAsync(p => p.Id != k.Id && p.Email_Adresa == zahtev.EmailAdresa))
                return EmailZauzet();

            k.Ime = zahtev.Ime;
            k.Prezime = zahtev.Prezime;
            k.Korisnicko_Ime = zahtev.KorisnickoIme;
            k.Datum_rodjenja = zahtev.DatumRodjenja.Date;
            k.Email_Adresa = zahtev.EmailAdresa;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (EmailAdresa.JeDuplikat(e))
            {
                return EmailZauzet();
            }
            catch (DbUpdateException e) when (KorisnickoIme.JeDuplikat(e))
            {
                return ImeZauzeto();
            }
            return Ok(await Context.Korisnici.Where(p => p.Id == k.Id).Select(KorisnikJavniDto.Projekcija).FirstAsync());
        }

        private BadRequestObjectResult EmailZauzet()
            => BadRequest(new { message = "Proverite unete podatke.", greske = new Dictionary<string, string> { ["emailAdresa"] = "Email adresa je vec u upotrebi." } });

        private BadRequestObjectResult ImeZauzeto()
            => BadRequest(new { message = "Proverite unete podatke.", greske = new Dictionary<string, string> { ["korisnickoIme"] = "Korisnicko ime je zauzeto." } });

        // Potvrda lozinkom za osetljive akcije. Pogresna lozinka se broji kao neuspela prijava
        // (ZastitaPrijave), pa ni ovde ne moze da se pogadja. null = lozinka je tacna.
        private ActionResult? ProveriLozinku(Korisnik k, string? lozinka, string polje)
        {
            if (_zastita.Zakljucan("k", k.Korisnicko_Ime) is TimeSpan preostalo)
                return Zakljucano(preostalo);
            if (string.IsNullOrEmpty(lozinka) || !Lozinke.Proveri(k.Lozinka_Hashirana, lozinka, out _))
            {
                _zastita.Neuspeh("k", k.Korisnicko_Ime);
                return BadRequest(new { message = "Pogresna lozinka.", greske = new Dictionary<string, string> { [polje] = "Pogresna lozinka." } });
            }
            return null;
        }

        [EnableCors("CORS")]
        [Route("VratiKorisnika_ID/{id}")]
        [HttpGet]
        public async Task<ActionResult> VratiKorisnika_ID(int id) //--NE VRACA DOGADJAJE KORISNIKA--
        {
            // Samo javna polja - bez lozinke, heša i tokena (vidi KorisnikJavniDto)
            var k = await Context.Korisnici
                .Where(p => p.Id == id)
                .Select(KorisnikJavniDto.Projekcija)
                .FirstOrDefaultAsync();
            if(k == null)
                return NotFound($"Korisnik sa ID-em {id} nije pronadjen");
            return Ok(k);
        }

        [EnableCors("CORS")]
        [Route("VratiSveKorisnikeOsim/{id}")]
        [HttpGet]
        public async Task<ActionResult> VratiSveKorisnike(int id) 
        {
            //svi korisnici osim ulogovanog (preko ID-a), samo javna polja
            var korisniciBezUlogovanog = await Context.Korisnici
                .Where(k => k.Id != id)
                .Select(KorisnikJavniDto.Projekcija)
                .ToListAsync();

            return Ok(korisniciBezUlogovanog);
        }


        // Postavlja ili menja profilnu sliku (multipart, polje "fajl"). Odgovor: { slika }.
        // Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuKorisniku")]
        [RequestSizeLimit(FileService.MaxVelicina + 64 * 1024)]
        public async Task<ActionResult> DodajSlikuKorisniku([FromForm] IFormFile? fajl, [FromQuery] int id_korisnika)
        {
            if (id_korisnika != User.IdKorisnika())
                return Forbid();
            Korisnik? k = await Context.Korisnici.FindAsync(id_korisnika);
            if (k == null)
                return NotFound();

            var rezultat = await _fileService.SacuvajSlikuAsync(fajl);
            if (rezultat.Greska != null)
                return BadRequest(new { message = rezultat.Greska });

            string? stara = k.KorisnikImage;
            k.KorisnikImage = rezultat.Ime;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.ObrisiSliku(rezultat.Ime);
                throw;
            }
            _fileService.ObrisiSliku(stara);
            return Ok(new { slika = k.KorisnikImage });
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKategorijeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiKategorijeKorisnika(int korisnik_Id)
        {

            var kategorije = await Context.Dogadjaji
                .Where(d => d.ID_Kreatora == korisnik_Id)
                .GroupBy(d => d.Kategorija)
                .Select(g => new { Kategorija = g.Key, Broj = g.Count() })
                .OrderByDescending(x => x.Broj)
                .ThenBy(x => x.Kategorija)
                .ToListAsync();

            return Ok(kategorije);
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiSlikuKorisnika/{korisnik_id}")]
        public async Task<ActionResult> IzbrisiSlikuKorisnika(int korisnik_id)
        {
            if (korisnik_id != User.IdKorisnika())
                return Forbid();
            Korisnik k = await Context.Korisnici.FindAsync(korisnik_id);
            if(k == null)
                return BadRequest("Korisnik ne postoji");

            // Fajl moze vec da fali na disku - referenca u bazi se svakako cisti
            string? stara = k.KorisnikImage;
            k.KorisnikImage = null;
            await Context.SaveChangesAsync();
            _fileService.ObrisiSliku(stara);
            return Ok("Uspesno izbrisana slika");
        }

        [HttpPost]
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(ZastitaPrijave.PolitikaPrijava)]
        [Route("LogovanjeKorisnik")]
        public async Task<ActionResult> LogovanjeKorisnik([FromBody] PrijavaZahtev zahtev)
        {
            if (zahtev == null || string.IsNullOrEmpty(zahtev.KorisnickoIme) || string.IsNullOrEmpty(zahtev.Lozinka))
                return Ok(new {nema = "NEMA_KORISNIKA"});

            string ime = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);

            // Zakljucano ime (previse pogresnih lozinki) se odbija pre provere lozinke
            if (_zastita.Zakljucan("k", ime) is TimeSpan preostalo)
                return Zakljucano(preostalo);

            Korisnik k = await Context.Korisnici.Where(p => p.Korisnicko_Ime == ime).FirstOrDefaultAsync();

            // Isti odgovor za nepostojeceg korisnika i pogresnu lozinku; broji se i nepostojece
            // ime, da se iz zakljucavanja ne bi videlo koja imena postoje
            if (k == null || !Lozinke.Proveri(k.Lozinka_Hashirana, zahtev.Lozinka, out bool ponovoHesirati))
            {
                _zastita.Neuspeh("k", ime);
                return Ok(new {nema = "NEMA_KORISNIKA"});
            }
            _zastita.Uspeh("k", ime);
            if (k.Blokiran == -1)
                return Ok(new {blokiran = "BLOKIRAN"});

            // Heš sa slabijim podesavanjima (npr. manje iteracija) se pri prijavi osvezava
            if (ponovoHesirati)
                k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);

            // Dodela tokena
            k.Token = NoviToken();
            k.Validnost = DateTime.UtcNow.AddMinutes(30);

            await Context.SaveChangesAsync();

            return Ok(new {token=k.Token, userID = k.Id});
        }

        // Dogadjaji korisnika za profil: najnoviji prvi, stranicenje kursorom (vidi DogadjajController)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiDogadjajeKorisnika(int korisnik_Id, [FromQuery] int limit = Paginacija.PodrazumevanaVelicina, [FromQuery] string? cursor = null)
        {
            if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                return BadRequest("Neispravan kursor");
            if (!await Context.Korisnici.AnyAsync(k => k.Id == korisnik_Id))
                return NotFound();

            var upit = Context.Dogadjaji.Include(d => d.KreatorId).Where(d => d.ID_Kreatora == korisnik_Id);
            return Ok(await Paginacija.UzmiAsync(upit, posle, limit));
        }

        // Notifikacije ulogovanog korisnika, najnovije prve (vidi NotifikacijaDto)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiNotifikacijeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiNotifikacijeKorisnika(int korisnik_Id, [FromQuery] int limit = 50)
        {
            if (korisnik_Id != User.IdKorisnika())
                return Forbid(); // svoje notifikacije
            var notifikacije = await Context.Notifikacije
                .Where(n => n.KorisnikCijaJeObjavaId == korisnik_Id)
                .OrderByDescending(n => n.Vreme).ThenByDescending(n => n.Id)
                .Take(Math.Clamp(limit, 1, 100))
                .Select(NotifikacijaDto.Projekcija)
                .ToListAsync();
            return Ok(notifikacije);
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiPetNotifikacijaKorisnika/{korisnik_Id}")]
        public Task<ActionResult> VratiPetNotifikacijaKorisnika(int korisnik_Id)
            => VratiNotifikacijeKorisnika(korisnik_Id, 5);

        // Blokiranje (samo administrator): korisnik odmah gubi pristup - TokenAuthenticationHandler
        // odbija blokirane na svakom zahtevu, a token mu se i menja, pa ni posle odblokiranja stara
        // sesija ne vazi (mora ponovo da se prijavi). Vec blokiran -> isti odgovor (idempotentno).
        [HttpPut]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("BlokirajKorisnika/{korisnik_id}")]
        public async Task<ActionResult> BlokirajKorisnika(int korisnik_id)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(korisnik_id);
            if (k == null)
                return NotFound($"Korisnik sa id-em {korisnik_id} ne postoji");
            k.Blokiran = -1;
            k.Token = NoviToken();
            k.Validnost = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok("Korisnik je blokiran");
        }

        [HttpPut]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("OdblokirajKorisnika/{korisnik_id}")]
        public async Task<ActionResult> OdblokirajKorisnika(int korisnik_id)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(korisnik_id);
            if (k == null)
                return NotFound($"Korisnik sa id-em {korisnik_id} ne postoji");
            k.Blokiran = 0;
            await Context.SaveChangesAsync();
            return Ok("Korisnik je odblokiran");
        }

        // Blokirani korisnici za admina, najnoviji nalozi prvi,
        // stranicenje kursorom kao i ostale liste (Models/Paginacija.cs)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("VratiBlokirane")]
        public async Task<ActionResult> VratiBlokirane([FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                return BadRequest("Neispravan kursor");
            var strana = await Paginacija.UzmiAsync(Context.Korisnici.Where(k => k.Blokiran == -1), posle, limit);
            var javni = KorisnikJavniDto.Projekcija.Compile();
            return Ok(new { stavke = strana.Stavke.Select(javni), strana.SledeciKursor, strana.ImaJos, strana.Ukupno });
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKorisnikeSearch/{unos}")]
        public async Task<ActionResult> VratiKorisnikeSearch(string unos)
        {
            string[] niz = unos.Split(" "); //Front sprecava korisnika da unese prazan string, tako da ce uvek biti minimum 1
            niz = niz.Where(p => !string.IsNullOrEmpty(p)).ToArray(); //brisanje praznih stringova ukoliko se jave

            if(niz.Length == 1)
            {
                var korisnici = await Context.Korisnici.Where(p => p.Ime.Contains(niz[0]) || 
                                                                p.Prezime.Contains(niz[0]) || 
                                                                p.Korisnicko_Ime.Contains(niz[0])).Take(6).ToListAsync();
                if(korisnici.Count() == 0)
                    return Ok(new {kraj = "KRAJ"});
                return Ok(korisnici.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
            }
            else
            {
                var korisnici2 = await Context.Korisnici.Where(p => p.Ime.Contains(niz[0]) && p.Prezime.Contains(niz[1])).Take(6).ToListAsync();
                if(korisnici2.Count() == 0)
                {
                    korisnici2 = await Context.Korisnici.Where(p => p.Ime.Contains(niz[1]) && p.Prezime.Contains(niz[0])).Take(6).ToListAsync();
                    if(korisnici2.Count() == 0)
                        return Ok(new {kraj = "KRAJ"});
                    return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
                }

                return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList()); 
            }
        }

        // Odjava: token prestaje da vazi odmah, a ne tek kad istekne sesija (do 30 min).
        // Token se zameni novim nasumicnim koji niko nema (kolona je obavezna i jedinstvena),
        // pa stari vise ne pronalazi nijednog korisnika -> svaki sledeci zahtev sa njim je 401.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("Odjava")]
        public async Task<ActionResult> Odjava()
        {
            var k = await Context.Korisnici.FindAsync(User.IdKorisnika());
            if (k == null)
                return Forbid(); // administrator se odjavljuje preko /Administrator/Odjava
            k.Token = NoviToken();
            k.Validnost = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok("Odjavljeni ste");
        }

        private ObjectResult Zakljucano(TimeSpan preostalo)
        {
            Response.Headers.RetryAfter = ((int)Math.Ceiling(preostalo.TotalSeconds)).ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ZastitaPrijave.Poruka(preostalo) });
        }

        // Nasumican token od 256 bita (64 hex znaka)
        private static string NoviToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    }
}
