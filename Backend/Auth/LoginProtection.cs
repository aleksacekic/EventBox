using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Caching.Memory;

namespace EventBoxApi.Auth
{
    // Zastita prijave od pogadjanja lozinke, u dva sloja:
    //
    //  1) Po IP adresi (ugradjeni ASP.NET rate limiter, politike ispod): jedan racunar sme
    //     ogranicen broj zahteva za prijavu/registraciju u vremenu. Visak -> 429.
    //
    //  2) Po nalogu (ova klasa): posle MaxFailures pogresnih lozinki za isto korisnicko ime u
    //     FailureWindow, ime se zakljucava na LockoutDuration - bez obzira sa koliko IP
    //     adresa stizu pokusaji. Zakljucano ime dobija 429 i pre provere lozinke, pa ni tacna
    //     lozinka tada ne prolazi (napadac ne moze da nastavi da proverava).
    //
    // Brojaci su u memoriji servera: restart ih brise, a vise instanci servera ih ne bi delilo.
    // Za ovu aplikaciju (jedan server) to je dovoljno, bez nove tabele u bazi.
    public class LoginProtection
    {
        public const string LoginPolicy = "login";
        public const string RegistrationPolicy = "registration";

        public const int MaxFailures = 5;
        public static readonly TimeSpan FailureWindow = TimeSpan.FromMinutes(15);
        public static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

        private readonly IMemoryCache _cache;
        private readonly object _lock = new();

        public LoginProtection(IMemoryCache cache) => _cache = cache;

        private sealed class State
        {
            public int Failures;
            public DateTime? LockedUntil;
        }

        // Korisnici i administratori imaju odvojene brojace ("k:" / "a:"); baza ne razlikuje
        // velika i mala slova u imenu, pa ni brojac
        private static string CacheKey(string vrsta, string ime) => $"login:{vrsta}:{ime.Trim().ToLowerInvariant()}";

        // Koliko jos traje zakljucavanje (null = nije zakljucano)
        public TimeSpan? GetRemainingLockout(string vrsta, string ime)
        {
            if (_cache.TryGetValue(CacheKey(vrsta, ime), out State? s) && s!.LockedUntil is DateTime doKad)
            {
                var preostalo = doKad - DateTime.UtcNow;
                if (preostalo > TimeSpan.Zero)
                    return preostalo;
            }
            return null;
        }

        public void RecordFailure(string vrsta, string ime)
        {
            var kljuc = CacheKey(vrsta, ime);
            lock (_lock)
            {
                var s = _cache.Get<State>(kljuc) ?? new State();
                s.Failures++;
                if (s.Failures >= MaxFailures)
                {
                    s.LockedUntil = DateTime.UtcNow.Add(LockoutDuration);
                    s.Failures = 0; // posle zakljucavanja brojanje krece ispocetka
                    _cache.Set(kljuc, s, LockoutDuration);
                }
                else
                {
                    // prozor se ne produzava sa svakim neuspehom: racuna se od prvog
                    if (s.Failures == 1)
                        _cache.Set(kljuc, s, FailureWindow);
                }
            }
        }

        public void RecordSuccess(string vrsta, string ime) => _cache.Remove(CacheKey(vrsta, ime));

        public static string LockoutMessage(TimeSpan preostalo)
            => $"Previse neuspelih pokusaja. Pokusajte ponovo za {Math.Max(1, (int)Math.Ceiling(preostalo.TotalMinutes))} min.";

        // Politike po IP adresi; poziva se iz Program.cs
        public static void Configure(RateLimiterOptions o)
        {
            // Prijava: 20 zahteva u minuti po IP adresi. Frontend za pogresnu lozinku salje dva
            // zahteva (korisnik pa administrator), pa je to ~10 pokusaja u minuti.
            o.AddPolicy(LoginPolicy, http => RateLimitPartition.GetSlidingWindowLimiter(
                http.Connection.RemoteIpAddress?.ToString() ?? "nepoznat",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 20, Window = TimeSpan.FromMinutes(1), SegmentsPerWindow = 6, QueueLimit = 0
                }));

            // Registracija: 5 naloga u 15 minuta po IP adresi (protiv masovnog pravljenja naloga)
            o.AddPolicy(RegistrationPolicy, http => RateLimitPartition.GetFixedWindowLimiter(
                http.Connection.RemoteIpAddress?.ToString() ?? "nepoznat",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5, Window = TimeSpan.FromMinutes(15), QueueLimit = 0
                }));

            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.OnRejected = async (ctx, ct) =>
            {
                TimeSpan cekaj = TimeSpan.FromMinutes(1);
                if (ctx.Lease.TryGetMetadata(MetadataName.RetryAfter, out var ra))
                    cekaj = ra;
                ctx.HttpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(cekaj.TotalSeconds)).ToString();
                int min = Math.Max(1, (int)Math.Ceiling(cekaj.TotalMinutes));
                await ctx.HttpContext.Response.WriteAsJsonAsync(
                    new { message = $"Previse zahteva sa ove adrese. Pokusajte ponovo za {min} min." }, ct);
            };
        }
    }
}
