using Microsoft.AspNetCore.Authorization;
using EventBoxApi.Auth;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    // Administratori: prijava i odjava, lista, dodavanje i brisanje. Rute pocinju sa /api/admins.
    [ApiController]
    [Route("api/admins")]
    public class AdminsController : ControllerBase
    {
        public EventBoxContext Context;
        private readonly IStringLocalizer<SharedResource> _t;
        public AdminsController(EventBoxContext context, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        public const int MaxNameLength = 50;

        // ID prijavljenog administratora (claim admin_id, vidi TokenAuthenticationHandler)
        private int? GetCurrentAdminId() => int.TryParse(User.FindFirst("admin_id")?.Value, out int id) ? id : null;

        // Sta klijent dobija o administratoru - bez lozinke i tokena. Ja = to je prijavljeni administrator.
        private static object ToPublic(Administrator a, int? mojId) => new
        {
            a.Id, a.Ime, a.Prezime, a.Korisnicko_ime, a.Email_adresa, Ja = a.Id == mojId
        };

        // GET /api/admins - lista administratora za admin stranicu (redom kako su dodavani)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAdmins()
        {
            int? mojId = GetCurrentAdminId();
            var admini = await Context.Administratori.OrderBy(a => a.Id).ToListAsync();
            return Ok(admini.Select(a => ToPublic(a, mojId)));
        }

        // POST /api/admins - novi administrator.
        // Pravila (provera je u telu metode, zato nema [Authorize] na akciji):
        //  - dok u bazi nema nijednog administratora, prvog moze da napravi bilo ko, ali SAMO
        //    sa lokalnog racunara (npr. iz Swagger-a na localhost) - resava "ko pravi prvog admina"
        //  - kad postoji bar jedan, nove administratore moze da dodaje samo prijavljen administrator
        [HttpPost]
        [EnableCors("CORS")]
        public async Task<ActionResult> CreateAdmin([FromBody] AdministratorZahtev zahtev)
        {
            if (await Context.Administratori.AnyAsync())
            {
                if (User.Identity?.IsAuthenticated != true)
                    return Unauthorized();
                if (!User.IsAdmin())
                    return Forbid();
            }
            else if (!System.Net.IPAddress.IsLoopback(HttpContext.Connection.RemoteIpAddress ?? System.Net.IPAddress.None))
            {
                return Forbid(); // prvog administratora moze da napravi samo lokalni zahtev
            }

            if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme)
                || string.IsNullOrEmpty(zahtev.Lozinka) || zahtev.Lozinka.Length < 8)
                return BadRequest(T("AdminUsernamePasswordRequired"));

            zahtev.KorisnickoIme = UsernameRules.Normalize(zahtev.KorisnickoIme);
            var greskaImena = UsernameRules.Validate(zahtev.KorisnickoIme, _t);
            if (greskaImena != null)
                return BadRequest(greskaImena);

            // Ime, prezime i email su obavezni (kolone su NOT NULL - bez provere bi pukao upis u bazu)
            zahtev.Ime = zahtev.Ime?.Trim() ?? "";
            zahtev.Prezime = zahtev.Prezime?.Trim() ?? "";
            if (zahtev.Ime.Length == 0 || zahtev.Prezime.Length == 0)
                return BadRequest(T("NameRequired"));
            if (zahtev.Ime.Length > MaxNameLength || zahtev.Prezime.Length > MaxNameLength)
                return BadRequest(T("NameMaxLength", MaxNameLength));
            zahtev.EmailAdresa = EmailRules.Normalize(zahtev.EmailAdresa);
            if (EmailRules.Validate(zahtev.EmailAdresa, _t) is string greskaEmaila)
                return BadRequest(greskaEmaila);
            if (await Context.Administratori.AnyAsync(p => p.Korisnicko_ime == zahtev.KorisnickoIme))
                return Conflict(T("AdminExists"));

            Administrator a = new Administrator();
            a.Ime = zahtev.Ime;
            a.Prezime = zahtev.Prezime;
            a.Email_adresa = zahtev.EmailAdresa;
            a.Korisnicko_ime = zahtev.KorisnickoIme;
            a.Lozinka = Passwords.Hash(zahtev.Lozinka);
            Context.Administratori.Add(a);
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                return Conflict(T("AdminExists"));
            }
            return Ok(ToPublic(a, GetCurrentAdminId())); // admin stranica ga odmah dodaje u listu
        }

        // DELETE /api/admins/{id}
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteAdmin(int id)
        {
            Administrator? a = await Context.Administratori.FindAsync(id);
            if (a == null)
                return NotFound();
            // Sopstveni nalog ne: administrator bi sam sebe izbacio usred rada
            if (a.Id == GetCurrentAdminId())
                return BadRequest(T("CannotDeleteSelf"));
            // Bez ijednog administratora prvog bi opet mogao da napravi bilo ko sa servera
            // (vidi CreateAdmin) - poslednji se zato ne brise
            if (await Context.Administratori.CountAsync() == 1)
                return Conflict(T("CannotDeleteLastAdmin"));

            Context.Administratori.Remove(a);
            await Context.SaveChangesAsync();
            return Ok(T("AdminDeleted", id));
        }

        // POST /api/admins/login
        [HttpPost]
        [EnableCors("CORS")]
        [EnableRateLimiting(LoginProtection.LoginPolicy)]
        [Route("login")]
        public async Task<ActionResult> Login([FromBody] PrijavaZahtev zahtev, [FromServices] LoginProtection loginProtection)
        {
            if (zahtev == null || string.IsNullOrEmpty(zahtev.KorisnickoIme) || string.IsNullOrEmpty(zahtev.Lozinka))
                return Ok(new {nema="NEMA"});

            string ime = UsernameRules.Normalize(zahtev.KorisnickoIme);
            if (loginProtection.GetRemainingLockout("a", ime) is TimeSpan preostalo)
            {
                Response.Headers.RetryAfter = ((int)Math.Ceiling(preostalo.TotalSeconds)).ToString();
                return StatusCode(StatusCodes.Status429TooManyRequests, new { message = LoginProtection.LockoutMessage(preostalo, _t) });
            }

            Administrator a = await Context.Administratori.Where(p => p.Korisnicko_ime == ime).FirstOrDefaultAsync();
            if (a == null || !Passwords.Verify(a.Lozinka, zahtev.Lozinka, out bool ponovoHesirati))
            {
                loginProtection.RecordFailure("a", ime);
                return Ok(new {nema="NEMA"});
            }
            loginProtection.RecordSuccess("a", ime);

            if (ponovoHesirati)
                a.Lozinka = Passwords.Hash(zahtev.Lozinka);

            // Sesija administratora (isto kao kod korisnika)
            a.Token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            a.Validnost = DateTime.UtcNow.AddMinutes(30);
            await Context.SaveChangesAsync();

            return Ok(new {token = a.Token, adminID = a.Id});
        }

        // POST /api/admins/logout - brise token administratora, pa stari odmah prestaje da vazi
        [HttpPost]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("logout")]
        public async Task<ActionResult> Logout()
        {
            if (GetCurrentAdminId() is not int id)
                return Forbid();
            var a = await Context.Administratori.FindAsync(id);
            if (a == null)
                return Forbid();
            a.Token = null;
            a.Validnost = null;
            await Context.SaveChangesAsync();
            return Ok(T("LoggedOut"));
        }
    }
}
