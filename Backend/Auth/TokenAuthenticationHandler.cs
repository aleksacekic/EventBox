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
    //     pa User.IdKorisnika() daje -1 i ne moze da se poistoveti sa nekim korisnikom
    public class TokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string Sema = "Token";
        public const string UlogaAdmin = "Admin";
        private static readonly TimeSpan TrajanjeSesije = TimeSpan.FromMinutes(30);

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
            var token = ProcitajToken();
            if (token == null)
                return AuthenticateResult.NoResult(); // nema tokena -> [Authorize] vraca 401


            var korisnik = await _context.Korisnici.FirstOrDefaultAsync(k => k.Token == token);
            if (korisnik != null)
                return await ProveriKorisnika(korisnik);

            var admin = await _context.Administratori.FirstOrDefaultAsync(a => a.Token == token);
            if (admin != null)
                return await ProveriAdmina(admin);

            return AuthenticateResult.Fail("Nevalidan token");
        }

        // Token iz zaglavlja "Authorization: Bearer <token>". WebSocket iz brauzera ne moze da
        // posalje zaglavlje, pa SignalR klijent salje ?access_token=<token> - to se prihvata SAMO
        // za hub, da se token ne bi slao u adresama obicnih API poziva (zavrsava u logovima).
        private string? ProcitajToken()
        {
            var zaglavlje = Request.Headers.Authorization.ToString();
            if (zaglavlje.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var t = zaglavlje.Substring("Bearer ".Length).Trim();
                return t.Length > 0 ? t : null;
            }
            if (Request.Path.StartsWithSegments("/notificationHub"))
            {
                var t = Request.Query["access_token"].ToString();
                return t.Length > 0 ? t : null;
            }
            return null;
        }

        private async Task<AuthenticateResult> ProveriKorisnika(Korisnik korisnik)
        {
            if (korisnik.Blokiran == -1)
                return AuthenticateResult.Fail("Nalog je blokiran");

            if (!await VazecaSesija(korisnik.Validnost, v => korisnik.Validnost = v))
                return AuthenticateResult.Fail("Sesija je istekla");

            return Uspeh(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, korisnik.Id.ToString()),
                new Claim(ClaimTypes.Name, korisnik.Korisnicko_Ime),
            });
        }

        private async Task<AuthenticateResult> ProveriAdmina(Administrator admin)
        {
            if (admin.Validnost == null || !await VazecaSesija(admin.Validnost.Value, v => admin.Validnost = v))
                return AuthenticateResult.Fail("Sesija je istekla");

            return Uspeh(new[]
            {
                new Claim(ClaimTypes.Role, UlogaAdmin),
                new Claim(ClaimTypes.Name, admin.Korisnicko_ime),
                new Claim("admin_id", admin.Id.ToString()),
            });
        }

        // Klizna sesija: produzavamo je tek kad je ostalo manje od 25 min, da ne pisemo
        // u bazu na svaki zahtev (npr. brojac poruka u headeru se osvezava na 3 s).
        private async Task<bool> VazecaSesija(DateTime validnost, Action<DateTime> postaviValidnost)
        {
            var sada = DateTime.UtcNow; // Validnost se cuva u UTC
            if (sada > validnost)
                return false;

            if (validnost - sada < TrajanjeSesije - TimeSpan.FromMinutes(5))
            {
                postaviValidnost(sada.Add(TrajanjeSesije));
                await _context.SaveChangesAsync();
            }
            return true;
        }

        private AuthenticateResult Uspeh(IEnumerable<Claim> claims)
        {
            var identitet = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identitet), Scheme.Name);
            return AuthenticateResult.Success(ticket);
        }
    }

    public static class KorisnikClaimsExtensions
    {
        // ID ulogovanog korisnika iz tokena (u kontroleru: User.IdKorisnika()).
        // Za administratora (nema NameIdentifier) vraca -1, sto nikad nije ID korisnika.
        public static int IdKorisnika(this ClaimsPrincipal user)
            => int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : -1;

        public static bool JeAdmin(this ClaimsPrincipal user)
            => user.IsInRole(TokenAuthenticationHandler.UlogaAdmin);
    }
}
