using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Models;

namespace EventBoxApi.Auth
{
    // Autentifikacija po tokenu: klijent salje "Authorization: Bearer <token>", a ovde
    // se token trazi u bazi - prvo medju korisnicima, pa medju administratorima.
    // Kad je validan, zahtev dobija ulogovanog (User) i [Authorize] ga propusta:
    //   - korisnik: claim NameIdentifier = njegov ID, bez uloge
    //   - administrator: uloga "Admin" (za [Authorize(Roles = "Admin")]), bez NameIdentifier,
    //     pa User.GetUserId() daje -1 i ne moze da se poistoveti sa nekim korisnikom
    public class TokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string SchemeName = "Token";
        public const string AdminRole = "Admin";
        private static readonly TimeSpan SessionDuration = TimeSpan.FromMinutes(30);

        private readonly EventBoxContext _context;

        public TokenAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            EventBoxContext context) : base(options, logger, encoder)
        {
            _context = context;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var token = ReadToken();
            if (token == null)
                return AuthenticateResult.NoResult(); // nema tokena -> [Authorize] vraca 401

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Token == token);
            if (user != null)
                return await AuthenticateUserAsync(user);

            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Token == token);
            if (admin != null)
                return await AuthenticateAdminAsync(admin);

            return AuthenticateResult.Fail("Nevalidan token");
        }

        // Token iz zaglavlja "Authorization: Bearer <token>". WebSocket iz brauzera ne moze da
        // posalje zaglavlje, pa SignalR klijent salje ?access_token=<token> - to se prihvata SAMO
        // za hub, da se token ne bi slao u adresama obicnih API poziva (zavrsava u logovima).
        private string? ReadToken()
        {
            var header = Request.Headers.Authorization.ToString();
            if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var t = header.Substring("Bearer ".Length).Trim();
                return t.Length > 0 ? t : null;
            }
            if (Request.Path.StartsWithSegments("/hubs/notifications"))
            {
                var t = Request.Query["access_token"].ToString();
                return t.Length > 0 ? t : null;
            }
            return null;
        }

        private async Task<AuthenticateResult> AuthenticateUserAsync(User user)
        {
            if (user.IsBlocked)
                return AuthenticateResult.Fail("Nalog je blokiran");

            if (!await ValidateSessionAsync(user.TokenExpiresAt, v => user.TokenExpiresAt = v))
                return AuthenticateResult.Fail("Sesija je istekla");

            return SuccessResult(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
            });
        }

        private async Task<AuthenticateResult> AuthenticateAdminAsync(Admin admin)
        {
            if (admin.TokenExpiresAt == null || !await ValidateSessionAsync(admin.TokenExpiresAt.Value, v => admin.TokenExpiresAt = v))
                return AuthenticateResult.Fail("Sesija je istekla");

            return SuccessResult(new[]
            {
                new Claim(ClaimTypes.Role, AdminRole),
                new Claim(ClaimTypes.Name, admin.Username),
                new Claim("admin_id", admin.Id.ToString()),
            });
        }

        // Klizna sesija: produzavamo je tek kad je ostalo manje od 25 min, da ne pisemo
        // u bazu na svaki zahtev.
        private async Task<bool> ValidateSessionAsync(DateTime expiresAt, Action<DateTime> setExpiresAt)
        {
            var now = DateTime.UtcNow; // rok sesije se cuva u UTC
            if (now > expiresAt)
                return false;

            if (expiresAt - now < SessionDuration - TimeSpan.FromMinutes(5))
            {
                setExpiresAt(now.Add(SessionDuration));
                await _context.SaveChangesAsync();
            }
            return true;
        }

        private AuthenticateResult SuccessResult(IEnumerable<Claim> claims)
        {
            var identity = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name);
            return AuthenticateResult.Success(ticket);
        }
    }

    public static class ClaimsPrincipalExtensions
    {
        // ID ulogovanog korisnika iz tokena (u kontroleru: User.GetUserId()).
        // Za administratora (nema NameIdentifier) vraca -1, sto nikad nije ID korisnika.
        public static int GetUserId(this ClaimsPrincipal user)
            => int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : -1;

        public static bool IsAdmin(this ClaimsPrincipal user)
            => user.IsInRole(TokenAuthenticationHandler.AdminRole);
    }
}
