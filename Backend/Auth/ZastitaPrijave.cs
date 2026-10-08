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
    //  2) Po nalogu (ova klasa): posle MaxNeuspeha pogresnih lozinki za isto korisnicko ime u
    //     ProzorNeuspeha, ime se zakljucava na TrajanjeZakljucavanja - bez obzira sa koliko IP
    //     adresa stizu pokusaji. Zakljucano ime dobija 429 i pre provere lozinke, pa ni tacna
    //     lozinka tada ne prolazi (napadac ne moze da nastavi da proverava).
    //
    // Brojaci su u memoriji servera: restart ih brise, a vise instanci servera ih ne bi delilo.
    // Za ovu aplikaciju (jedan server) to je dovoljno, bez nove tabele u bazi.
    public class ZastitaPrijave
    {
        public const string PolitikaPrijava = "prijava";
        public const string PolitikaRegistracija = "registracija";

        public const int MaxNeuspeha = 5;
        public static readonly TimeSpan ProzorNeuspeha = TimeSpan.FromMinutes(15);
        public static readonly TimeSpan TrajanjeZakljucavanja = TimeSpan.FromMinutes(15);

        private readonly IMemoryCache _kes;
        private readonly object _brava = new();

        public ZastitaPrijave(IMemoryCache kes) => _kes = kes;

        private sealed class Stanje
        {
            public int Neuspeha;
            public DateTime? ZakljucanDo;
        }

        // Korisnici i administratori imaju odvojene brojace ("k:" / "a:"); baza ne razlikuje
        // velika i mala slova u imenu, pa ni brojac
        private static string Kljuc(string vrsta, string ime) => $"prijava:{vrsta}:{ime.Trim().ToLowerInvariant()}";

        // Koliko jos traje zakljucavanje (null = nije zakljucano)
        public TimeSpan? Zakljucan(string vrsta, string ime)
        {
            if (_kes.TryGetValue(Kljuc(vrsta, ime), out Stanje? s) && s!.ZakljucanDo is DateTime doKad)
            {
                var preostalo = doKad - DateTime.UtcNow;
                if (preostalo > TimeSpan.Zero)
                    return preostalo;
            }
            return null;
        }

        public void Neuspeh(string vrsta, string ime)
        {
            var kljuc = Kljuc(vrsta, ime);
            lock (_brava)
            {
                var s = _kes.Get<Stanje>(kljuc) ?? new Stanje();
                s.Neuspeha++;
                if (s.Neuspeha >= MaxNeuspeha)
                {
                    s.ZakljucanDo = DateTime.UtcNow.Add(TrajanjeZakljucavanja);
                    s.Neuspeha = 0; // posle zakljucavanja brojanje krece ispocetka
                    _kes.Set(kljuc, s, TrajanjeZakljucavanja);
                }
                else
                {
                    // prozor se ne produzava sa svakim neuspehom: racuna se od prvog
                    if (s.Neuspeha == 1)
                        _kes.Set(kljuc, s, ProzorNeuspeha);
                }
            }
        }

        public void Uspeh(string vrsta, string ime) => _kes.Remove(Kljuc(vrsta, ime));

        public static string Poruka(TimeSpan preostalo)
            => $"Previse neuspelih pokusaja. Pokusajte ponovo za {Math.Max(1, (int)Math.Ceiling(preostalo.TotalMinutes))} min.";

        // Politike po IP adresi; poziva se iz Program.cs
        public static void Podesi(RateLimiterOptions o)
        {
            // Prijava: 20 zahteva u minuti po IP adresi. Frontend za pogresnu lozinku salje dva
            // zahteva (korisnik pa administrator), pa je to ~10 pokusaja u minuti.
            o.AddPolicy(PolitikaPrijava, http => RateLimitPartition.GetSlidingWindowLimiter(
                http.Connection.RemoteIpAddress?.ToString() ?? "nepoznat",
                _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = 20, Window = TimeSpan.FromMinutes(1), SegmentsPerWindow = 6, QueueLimit = 0
                }));

            // Registracija: 5 naloga u 15 minuta po IP adresi (protiv masovnog pravljenja naloga)
            o.AddPolicy(PolitikaRegistracija, http => RateLimitPartition.GetFixedWindowLimiter(
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
