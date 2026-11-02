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
        private string T(string key, params object[] args) => _t[key, args];

        public const int MaxNameLength = 50;

        // ID prijavljenog administratora (claim admin_id, vidi TokenAuthenticationHandler)
        private int? GetCurrentAdminId() => int.TryParse(User.FindFirst("admin_id")?.Value, out int id) ? id : null;

        // Sta klijent dobija o administratoru - bez lozinke i tokena.
        // IsCurrent = to je prijavljeni administrator.
        private static object ToPublic(Admin a, int? currentAdminId) => new
        {
            a.Id, a.FirstName, a.LastName, a.Username, a.Email, IsCurrent = a.Id == currentAdminId
        };

        // GET /api/admins - lista administratora za admin stranicu (redom kako su dodavani)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetAdmins()
        {
            int? currentId = GetCurrentAdminId();
            var admins = await Context.Admins.OrderBy(a => a.Id).ToListAsync();
            return Ok(admins.Select(a => ToPublic(a, currentId)));
        }

        // POST /api/admins - novi administrator.
        // Pravila (provera je u telu metode, zato nema [Authorize] na akciji):
        //  - dok u bazi nema nijednog administratora, prvog moze da napravi bilo ko, ali SAMO
        //    sa lokalnog racunara (npr. iz Swagger-a na localhost) - resava "ko pravi prvog admina"
        //  - kad postoji bar jedan, nove administratore moze da dodaje samo prijavljen administrator
        [HttpPost]
        [EnableCors("CORS")]
        public async Task<ActionResult> CreateAdmin([FromBody] CreateAdminRequest request)
        {
            if (await Context.Admins.AnyAsync())
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

            if (request == null || string.IsNullOrWhiteSpace(request.Username)
                || string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
                return BadRequest(T("AdminUsernamePasswordRequired"));

            request.Username = UsernameRules.Normalize(request.Username);
            var usernameError = UsernameRules.Validate(request.Username, _t);
            if (usernameError != null)
                return BadRequest(usernameError);

            // Ime, prezime i email su obavezni (kolone su NOT NULL - bez provere bi pukao upis u bazu)
            request.FirstName = request.FirstName?.Trim() ?? "";
            request.LastName = request.LastName?.Trim() ?? "";
            if (request.FirstName.Length == 0 || request.LastName.Length == 0)
                return BadRequest(T("NameRequired"));
            if (request.FirstName.Length > MaxNameLength || request.LastName.Length > MaxNameLength)
                return BadRequest(T("NameMaxLength", MaxNameLength));
            request.Email = EmailRules.Normalize(request.Email);
            if (EmailRules.Validate(request.Email, _t) is string emailError)
                return BadRequest(emailError);
            if (await Context.Admins.AnyAsync(a => a.Username == request.Username))
                return Conflict(T("AdminExists"));

            var admin = new Admin
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Username = request.Username,
                PasswordHash = Passwords.Hash(request.Password),
            };
            Context.Admins.Add(admin);
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                return Conflict(T("AdminExists"));
            }
            return Ok(ToPublic(admin, GetCurrentAdminId())); // admin stranica ga odmah dodaje u listu
        }

        // DELETE /api/admins/{id}
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteAdmin(int id)
        {
            var admin = await Context.Admins.FindAsync(id);
            if (admin == null)
                return NotFound();
            // Sopstveni nalog ne: administrator bi sam sebe izbacio usred rada
            if (admin.Id == GetCurrentAdminId())
                return BadRequest(T("CannotDeleteSelf"));
            // Bez ijednog administratora prvog bi opet mogao da napravi bilo ko sa servera
            // (vidi CreateAdmin) - poslednji se zato ne brise
            if (await Context.Admins.CountAsync() == 1)
                return Conflict(T("CannotDeleteLastAdmin"));

            Context.Admins.Remove(admin);
            await Context.SaveChangesAsync();
            return Ok(T("AdminDeleted", id));
        }

        // POST /api/admins/login
        // Odgovor: { token, adminId } ili { error: INVALID_CREDENTIALS }
        [HttpPost]
        [EnableCors("CORS")]
        [EnableRateLimiting(LoginProtection.LoginPolicy)]
        [Route("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request, [FromServices] LoginProtection loginProtection)
        {
            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return Ok(new { error = "INVALID_CREDENTIALS" });

            string username = UsernameRules.Normalize(request.Username);
            if (loginProtection.GetRemainingLockout("a", username) is TimeSpan remaining)
            {
                Response.Headers.RetryAfter = ((int)Math.Ceiling(remaining.TotalSeconds)).ToString();
                return StatusCode(StatusCodes.Status429TooManyRequests, new { message = LoginProtection.LockoutMessage(remaining, _t) });
            }

            var admin = await Context.Admins.FirstOrDefaultAsync(a => a.Username == username);
            if (admin == null || !Passwords.Verify(admin.PasswordHash, request.Password, out bool needsRehash))
            {
                loginProtection.RecordFailure("a", username);
                return Ok(new { error = "INVALID_CREDENTIALS" });
            }
            loginProtection.RecordSuccess("a", username);

            if (needsRehash)
                admin.PasswordHash = Passwords.Hash(request.Password);

            // Sesija administratora (isto kao kod korisnika)
            admin.Token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
            admin.TokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await Context.SaveChangesAsync();

            return Ok(new { token = admin.Token, adminId = admin.Id });
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
            var admin = await Context.Admins.FindAsync(id);
            if (admin == null)
                return Forbid();
            admin.Token = null;
            admin.TokenExpiresAt = null;
            await Context.SaveChangesAsync();
            return Ok(T("LoggedOut"));
        }
    }
}
