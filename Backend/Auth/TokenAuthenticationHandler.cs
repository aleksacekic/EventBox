using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Models;

namespace EventBoxApi.Auth
{
    // Autentifikacija po tokenu: klijent salje "Authorization: Bearer <token>", a ovde
    // se token trazi u bazi (Korisnik.Token). Kad je validan, zahtev dobija ulogovanog
    // korisnika (User) i [Authorize] ga propusta. Zamenjuje staru rucnu proveru
    // Validnost.Validiraj() koja se pozivala samo u par metoda i citala kolacice.
    public class TokenAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public const string Sema = "Token";
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
            var zaglavlje = Request.Headers.Authorization.ToString();
            if (!zaglavlje.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return AuthenticateResult.NoResult(); // nema tokena -> [Authorize] vraca 401

            var token = zaglavlje.Substring("Bearer ".Length).Trim();
            if (token.Length == 0)
                return AuthenticateResult.NoResult();

            var korisnik = await _context.Korisnici.FirstOrDefaultAsync(k => k.Token == token);
            if (korisnik == null)
                return AuthenticateResult.Fail("Nevalidan token");
            if (korisnik.Blokiran == -1)
                return AuthenticateResult.Fail("Nalog je blokiran");

            var sada = DateTime.Now;
            if (sada > korisnik.Validnost)
                return AuthenticateResult.Fail("Sesija je istekla");

            // Klizna sesija: produzavamo je tek kad je ostalo manje od 25 min, da ne pisemo
            // u bazu na svaki zahtev (npr. brojac poruka u headeru se osvezava na 3 s).
            if (korisnik.Validnost - sada < TrajanjeSesije - TimeSpan.FromMinutes(5))
            {
                korisnik.Validnost = sada.Add(TrajanjeSesije);
                await _context.SaveChangesAsync();
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, korisnik.Id.ToString()),
                new Claim(ClaimTypes.Name, korisnik.Korisnicko_Ime),
            };
            var identitet = new ClaimsIdentity(claims, Scheme.Name);
            var ticket = new AuthenticationTicket(new ClaimsPrincipal(identitet), Scheme.Name);
            return AuthenticateResult.Success(ticket);
        }
    }

    public static class KorisnikClaimsExtensions
    {
        // ID ulogovanog korisnika iz tokena (u kontroleru: User.IdKorisnika())
        public static int IdKorisnika(this ClaimsPrincipal user)
            => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }
}
