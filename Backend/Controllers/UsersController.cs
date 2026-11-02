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
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    // Korisnici: registracija, prijava i odjava, profil, profilna slika, a za administratora
    // blokiranje i pregled korisnika. Sve rute pocinju sa /api/users.
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        public IFileService _fileService;
        private readonly NotificationService _notifications;
        private readonly LoginProtection _loginProtection;
        private readonly IStringLocalizer<SharedResource> _t;


        public UsersController(EventBoxContext context, IFileService fs, NotificationService notifications, LoginProtection loginProtection, IStringLocalizer<SharedResource> t)
        {
            Context = context;
            this._fileService = fs;
            _notifications = notifications;
            _loginProtection = loginProtection;
            _t = t;
        }


        // POST /api/users - registracija novog korisnika
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(LoginProtection.RegistrationPolicy)]
        [HttpPost]
        public async Task<ActionResult> Register([FromBody] RegistracijaZahtev zahtev)
        {
            if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.Ime) || string.IsNullOrWhiteSpace(zahtev.Prezime)
                || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme) || string.IsNullOrWhiteSpace(zahtev.EmailAdresa)
                || string.IsNullOrEmpty(zahtev.Lozinka) || zahtev.Lozinka.Length < 8)
                return BadRequest(T("AllFieldsRequired"));

            zahtev.KorisnickoIme = UsernameRules.Normalize(zahtev.KorisnickoIme);
            var greskaImena = UsernameRules.Validate(zahtev.KorisnickoIme, _t);
            if (greskaImena != null)
                return BadRequest(greskaImena);

            zahtev.EmailAdresa = EmailRules.Normalize(zahtev.EmailAdresa);
            if (EmailRules.Validate(zahtev.EmailAdresa, _t) is string greskaEmaila)
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
            k.Lozinka_Hashirana = Passwords.Hash(zahtev.Lozinka);
            k.Token = GenerateToken();
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
            catch (DbUpdateException e) when (EmailRules.IsDuplicate(e))
            {
                return Ok(new {odgovor = "EMAIL"});
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                // Neko je isto ime zauzeo izmedju provere gore i upisa
                return Ok(new {odgovor = "KORISNICKO_IME"});
            }
            return Ok(T("UserRegistered", zahtev.KorisnickoIme));
        }

        // POST /api/users/login
        [HttpPost]
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(LoginProtection.LoginPolicy)]
        [Route("login")]
        public async Task<ActionResult> Login([FromBody] PrijavaZahtev zahtev)
        {
            if (zahtev == null || string.IsNullOrEmpty(zahtev.KorisnickoIme) || string.IsNullOrEmpty(zahtev.Lozinka))
                return Ok(new {nema = "NEMA_KORISNIKA"});

            string ime = UsernameRules.Normalize(zahtev.KorisnickoIme);

            // Zakljucano ime (previse pogresnih lozinki) se odbija pre provere lozinke
            if (_loginProtection.GetRemainingLockout("k", ime) is TimeSpan preostalo)
                return LockedOut(preostalo);

            Korisnik k = await Context.Korisnici.Where(p => p.Korisnicko_Ime == ime).FirstOrDefaultAsync();

            // Isti odgovor za nepostojeceg korisnika i pogresnu lozinku; broji se i nepostojece
            // ime, da se iz zakljucavanja ne bi videlo koja imena postoje
            if (k == null || !Passwords.Verify(k.Lozinka_Hashirana, zahtev.Lozinka, out bool ponovoHesirati))
            {
                _loginProtection.RecordFailure("k", ime);
                return Ok(new {nema = "NEMA_KORISNIKA"});
            }
            _loginProtection.RecordSuccess("k", ime);
            if (k.Blokiran == -1)
                return Ok(new {blokiran = "BLOKIRAN"});

            // Heš sa slabijim podesavanjima (npr. manje iteracija) se pri prijavi osvezava
            if (ponovoHesirati)
                k.Lozinka_Hashirana = Passwords.Hash(zahtev.Lozinka);

            // Dodela tokena
            k.Token = GenerateToken();
            k.Validnost = DateTime.UtcNow.AddMinutes(30);

            await Context.SaveChangesAsync();

            return Ok(new {token=k.Token, userID = k.Id});
        }

        // POST /api/users/logout
        // Odjava: token prestaje da vazi odmah, a ne tek kad istekne sesija (do 30 min).
        // Token se zameni novim nasumicnim koji niko nema (kolona je obavezna i jedinstvena),
        // pa stari vise ne pronalazi nijednog korisnika -> svaki sledeci zahtev sa njim je 401.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("logout")]
        public async Task<ActionResult> Logout()
        {
            var k = await Context.Korisnici.FindAsync(User.GetUserId());
            if (k == null)
                return Forbid(); // administrator se odjavljuje preko /api/admins/logout
            k.Token = GenerateToken();
            k.Validnost = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok(T("LoggedOut"));
        }

        // GET /api/users - svi korisnici osim ulogovanog (lista za novi razgovor u cetu), samo javna polja
        [EnableCors("CORS")]
        [HttpGet]
        public async Task<ActionResult> GetUsers()
        {
            int id = User.GetUserId();
            bool admin = User.IsAdmin();
            var korisniciBezUlogovanog = await Context.Korisnici
                .Where(k => k.Id != id && (admin || k.Blokiran != -1)) // blokirani se ne nude
                .Select(KorisnikJavniDto.Projekcija)
                .ToListAsync();

            return Ok(korisniciBezUlogovanog);
        }

        // GET /api/users/search?query=ana - do 6 korisnika po imenu, prezimenu ili korisnickom imenu
        [HttpGet]
        [EnableCors("CORS")]
        [Route("search")]
        public async Task<ActionResult> SearchUsers([FromQuery] string? query)
        {
            string[] niz = (query ?? "").Split(" ");
            niz = niz.Where(p => !string.IsNullOrEmpty(p)).ToArray(); //brisanje praznih stringova ukoliko se jave
            if (niz.Length == 0)
                return Ok(new {kraj = "KRAJ"});

            // Blokirani korisnici se ne pronalaze - osim kad trazi administrator
            IQueryable<Korisnik> baza = User.IsAdmin() ? Context.Korisnici : Context.Korisnici.Where(p => p.Blokiran != -1);

            if(niz.Length == 1)
            {
                var korisnici = await baza.Where(p => p.Ime.Contains(niz[0]) ||
                                                                p.Prezime.Contains(niz[0]) ||
                                                                p.Korisnicko_Ime.Contains(niz[0])).Take(6).ToListAsync();
                if(korisnici.Count() == 0)
                    return Ok(new {kraj = "KRAJ"});
                return Ok(korisnici.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
            }
            else
            {
                var korisnici2 = await baza.Where(p => p.Ime.Contains(niz[0]) && p.Prezime.Contains(niz[1])).Take(6).ToListAsync();
                if(korisnici2.Count() == 0)
                {
                    korisnici2 = await baza.Where(p => p.Ime.Contains(niz[1]) && p.Prezime.Contains(niz[0])).Take(6).ToListAsync();
                    if(korisnici2.Count() == 0)
                        return Ok(new {kraj = "KRAJ"});
                    return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
                }

                return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
            }
        }

        // GET /api/users/{id} - javni podaci korisnika (bez njegovih dogadjaja)
        [EnableCors("CORS")]
        [Route("{id:int}")]
        [HttpGet]
        public async Task<ActionResult> GetUser(int id)
        {
            // Samo javna polja - bez lozinke, heša i tokena (vidi KorisnikJavniDto)
            var k = await Context.Korisnici
                .Where(p => p.Id == id)
                .Select(KorisnikJavniDto.Projekcija)
                .FirstOrDefaultAsync();
            if(k == null)
                return NotFound(T("UserNotFound", id));
            return Ok(k);
        }

        // PUT /api/users/me - izmena podataka ulogovanog korisnika.
        // Neispravan unos -> 400 { message, greske: { polje: poruka } }
        // (polja: ime, prezime, korisnickoIme, emailAdresa, datumRodjenja, lozinka, trenutnaLozinka).
        // Nova lozinka trazi i trenutnu. Uspeh -> javni podaci korisnika (KorisnikJavniDto).
        [EnableCors("CORS")]
        [Route("me")]
        [HttpPut]
        public async Task<ActionResult> UpdateCurrentUser([FromBody] IzmenaKorisnikaZahtev zahtev)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(User.GetUserId());
            if (k == null)
                return Forbid(); // administrator nema korisnicki profil
            if (zahtev == null)
                return BadRequest(T("MissingData"));

            var greske = new Dictionary<string, string>();
            zahtev.Ime = zahtev.Ime?.Trim() ?? "";
            zahtev.Prezime = zahtev.Prezime?.Trim() ?? "";
            zahtev.EmailAdresa = EmailRules.Normalize(zahtev.EmailAdresa);
            if (zahtev.Ime.Length is < 1 or > 50) greske["ime"] = T("FirstNameLength");
            if (zahtev.Prezime.Length is < 1 or > 50) greske["prezime"] = T("LastNameLength");
            zahtev.KorisnickoIme = UsernameRules.Normalize(zahtev.KorisnickoIme);
            if (UsernameRules.Validate(zahtev.KorisnickoIme, _t) is string greskaImena) greske["korisnickoIme"] = greskaImena;
            if (EmailRules.Validate(zahtev.EmailAdresa, _t) is string greskaEmaila)
                greske["emailAdresa"] = greskaEmaila;
            if (zahtev.DatumRodjenja < new DateTime(1900, 1, 1) || zahtev.DatumRodjenja > DateTime.Today)
                greske["datumRodjenja"] = T("InvalidBirthDate");
            if (!string.IsNullOrEmpty(zahtev.Lozinka) && zahtev.Lozinka.Length < 8)
                greske["lozinka"] = T("NewPasswordLength");
            if (greske.Count > 0)
                return BadRequest(new { message = T("CheckInput"), greske });

            if (!string.IsNullOrEmpty(zahtev.Lozinka))
            {
                var greskaLozinke = VerifyPassword(k, zahtev.TrenutnaLozinka, "trenutnaLozinka");
                if (greskaLozinke != null)
                    return greskaLozinke;
                k.Lozinka_Hashirana = Passwords.Hash(zahtev.Lozinka);
            }

            if (k.Korisnicko_Ime != zahtev.KorisnickoIme &&
                await Context.Korisnici.AnyAsync(p => p.Korisnicko_Ime == zahtev.KorisnickoIme))
                return UsernameTaken();
            if (await Context.Korisnici.AnyAsync(p => p.Id != k.Id && p.Email_Adresa == zahtev.EmailAdresa))
                return EmailTaken();

            k.Ime = zahtev.Ime;
            k.Prezime = zahtev.Prezime;
            k.Korisnicko_Ime = zahtev.KorisnickoIme;
            k.Datum_rodjenja = zahtev.DatumRodjenja.Date;
            k.Email_Adresa = zahtev.EmailAdresa;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (EmailRules.IsDuplicate(e))
            {
                return EmailTaken();
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                return UsernameTaken();
            }
            return Ok(await Context.Korisnici.Where(p => p.Id == k.Id).Select(KorisnikJavniDto.Projekcija).FirstAsync());
        }

        // DELETE /api/users/{id} - brisanje sopstvenog naloga (trazi lozinku u telu zahteva)
        [EnableCors("CORS")]
        [Route("{id:int}")]
        [HttpDelete]
        public async Task<ActionResult> DeleteUser(int id, [FromBody] BrisanjeNalogaZahtev? zahtev)
        {
            if (id != User.GetUserId())
                return Forbid(); // nalog brise samo njegov vlasnik
            var korisnik = await Context.Korisnici.FindAsync(id);
            if (korisnik == null)
                return NotFound();
            // Nepovratno - trazi se i lozinka, ne samo token (npr. otkljucan tudji racunar)
            var greskaLozinke = VerifyPassword(korisnik, zahtev?.Lozinka, "lozinka");
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
            var uklonjene = await _notifications.RemoveAsync(Context.Notifikacije.Where(n => n.KorisnikKojiReagujeId == id));
            Context.Korisnici.Remove(korisnik);
            await Context.SaveChangesAsync();
            await ReactionCounters.RefreshAsync(Context, reagovaoNa);
            await _notifications.NotifyRemovedAsync(uklonjene); // vlasnicima tih objava nestaju uzivo
            slike.ForEach(_fileService.DeleteImage);
            return Ok(T("UserDeleted", id));
        }

        // PUT /api/users/{id}/image - postavlja ili menja profilnu sliku (multipart, polje "fajl").
        // Odgovor: { slika }. Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        [RequestSizeLimit(FileService.MaxFileSize + 64 * 1024)]
        public async Task<ActionResult> UploadProfileImage(int id, IFormFile? fajl)
        {
            if (id != User.GetUserId())
                return Forbid();
            Korisnik? k = await Context.Korisnici.FindAsync(id);
            if (k == null)
                return NotFound();

            var rezultat = await _fileService.SaveImageAsync(fajl);
            if (rezultat.Error != null)
                return BadRequest(new { message = rezultat.Error });

            string? stara = k.KorisnikImage;
            k.KorisnikImage = rezultat.FileName;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.DeleteImage(rezultat.FileName);
                throw;
            }
            _fileService.DeleteImage(stara);
            return Ok(new { slika = k.KorisnikImage });
        }

        // DELETE /api/users/{id}/image - uklanja profilnu sliku
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        public async Task<ActionResult> DeleteProfileImage(int id)
        {
            if (id != User.GetUserId())
                return Forbid();
            Korisnik k = await Context.Korisnici.FindAsync(id);
            if(k == null)
                return BadRequest(T("UserNotFound", id));

            // Fajl moze vec da fali na disku - referenca u bazi se svakako cisti
            string? stara = k.KorisnikImage;
            k.KorisnikImage = null;
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(stara);
            return Ok(T("ImageDeleted"));
        }

        // GET /api/users/{id}/categories - koliko dogadjaja korisnik ima po kategoriji
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}/categories")]
        public async Task<ActionResult> GetUserCategories(int id)
        {

            var kategorije = await Context.Dogadjaji
                .Where(d => d.ID_Kreatora == id)
                .GroupBy(d => d.Kategorija)
                .Select(g => new { Kategorija = g.Key, Broj = g.Count() })
                .OrderByDescending(x => x.Broj)
                .ThenBy(x => x.Kategorija)
                .ToListAsync();

            return Ok(kategorije);
        }

        // GET /api/users/{id}/events - dogadjaji korisnika za profil: najnoviji prvi,
        // stranicenje kursorom (vidi EventsController)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}/events")]
        public async Task<ActionResult> GetUserEvents(int id, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest(T("InvalidCursor"));
            if (!await Context.Korisnici.AnyAsync(k => k.Id == id))
                return NotFound();

            var upit = Context.Dogadjaji.Include(d => d.KreatorId).Where(d => d.ID_Kreatora == id);
            if (!User.IsAdmin())
                upit = upit.Where(d => d.KreatorId.Blokiran != -1); // sadrzaj blokiranih se ne prikazuje
            return Ok(await Pagination.GetPageAsync(upit, posle, limit));
        }

        // PUT /api/users/{id}/block - blokiranje (samo administrator): korisnik odmah gubi pristup -
        // TokenAuthenticationHandler odbija blokirane na svakom zahtevu, a token mu se i menja, pa ni
        // posle odblokiranja stara sesija ne vazi (mora ponovo da se prijavi). Vec blokiran -> isti
        // odgovor (idempotentno).
        [HttpPut]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/block")]
        public async Task<ActionResult> BlockUser(int id)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(id);
            if (k == null)
                return NotFound(T("UserNotFound", id));
            k.Blokiran = -1;
            k.Token = GenerateToken();
            k.Validnost = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok(T("UserBlocked"));
        }

        // DELETE /api/users/{id}/block - odblokiranje (samo administrator)
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/block")]
        public async Task<ActionResult> UnblockUser(int id)
        {
            Korisnik? k = await Context.Korisnici.FindAsync(id);
            if (k == null)
                return NotFound(T("UserNotFound", id));
            k.Blokiran = 0;
            await Context.SaveChangesAsync();
            return Ok(T("UserUnblocked"));
        }

        // GET /api/users/{id}/details - admin: pregled jednog korisnika - javni podaci + status naloga
        // i koliko je puta prijavljen njegov sadrzaj (bez lozinke, heša i tokena, kao KorisnikJavniDto)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/details")]
        public async Task<ActionResult> GetUserDetails(int id)
        {
            var k = await Context.Korisnici
                .Where(p => p.Id == id)
                .Select(p => new
                {
                    p.Id,
                    p.Ime,
                    p.Prezime,
                    p.Korisnicko_Ime,
                    p.Email_Adresa,
                    p.Datum_rodjenja,
                    p.KorisnikImage,
                    Blokiran = p.Blokiran == -1,
                    BrojDogadjaja = Context.Dogadjaji.Count(d => d.ID_Kreatora == p.Id),
                    BrojPrijava = Context.Razlozi.Count(r => r.Prijavljeni_dogadjaj_Id.Dogadjaj_Id.ID_Kreatora == p.Id),
                })
                .FirstOrDefaultAsync();
            if (k == null)
                return NotFound(T("UserNotFound", id));
            return Ok(k);
        }

        // GET /api/users/blocked - blokirani korisnici za admina, najnoviji nalozi prvi,
        // stranicenje kursorom kao i ostale liste (Models/Pagination.cs)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("blocked")]
        public async Task<ActionResult> GetBlockedUsers([FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest(T("InvalidCursor"));
            var strana = await Pagination.GetPageAsync(Context.Korisnici.Where(k => k.Blokiran == -1), posle, limit);
            var javni = KorisnikJavniDto.Projekcija.Compile();
            return Ok(new { stavke = strana.Stavke.Select(javni), strana.SledeciKursor, strana.ImaJos, strana.Ukupno });
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        private BadRequestObjectResult EmailTaken()
            => BadRequest(new { message = T("CheckInput"), greske = new Dictionary<string, string> { ["emailAdresa"] = T("EmailTaken") } });

        private BadRequestObjectResult UsernameTaken()
            => BadRequest(new { message = T("CheckInput"), greske = new Dictionary<string, string> { ["korisnickoIme"] = T("UsernameTaken") } });

        // Potvrda lozinkom za osetljive akcije. Pogresna lozinka se broji kao neuspela prijava
        // (LoginProtection), pa ni ovde ne moze da se pogadja. null = lozinka je tacna.
        private ActionResult? VerifyPassword(Korisnik k, string? lozinka, string polje)
        {
            if (_loginProtection.GetRemainingLockout("k", k.Korisnicko_Ime) is TimeSpan preostalo)
                return LockedOut(preostalo);
            if (string.IsNullOrEmpty(lozinka) || !Passwords.Verify(k.Lozinka_Hashirana, lozinka, out _))
            {
                _loginProtection.RecordFailure("k", k.Korisnicko_Ime);
                return BadRequest(new { message = T("WrongPassword"), greske = new Dictionary<string, string> { [polje] = T("WrongPassword") } });
            }
            return null;
        }

        private ObjectResult LockedOut(TimeSpan preostalo)
        {
            Response.Headers.RetryAfter = ((int)Math.Ceiling(preostalo.TotalSeconds)).ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = LoginProtection.LockoutMessage(preostalo, _t) });
        }

        // Nasumican token od 256 bita (64 hex znaka)
        private static string GenerateToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

    }
}
