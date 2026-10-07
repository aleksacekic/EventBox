using Microsoft.EntityFrameworkCore;

namespace Models
{
    // Entiteti koji se stranice (sortiraju po Id-u, najnoviji prvi)
    public interface IImaId
    {
        int Id { get; }
    }

    // Jedna "strana" rezultata. JSON: { stavke, sledeciKursor, imaJos, ukupno }
    public class Strana<T>
    {
        public List<T> Stavke { get; set; } = new();
        // Kursor za sledecu stranu; null kad nema vise (imaJos == false)
        public string? SledeciKursor { get; set; }
        public bool ImaJos { get; set; }
        // Ukupan broj stavki - samo uz PRVU stranu (bez kursora), inace null
        public int? Ukupno { get; set; }
    }

    // Stranicenje kursorom (keyset), standardni nacin za "beskonacni skrol" i feedove.
    //
    //   GET /lista?limit=3                    -> prva strana (najnovije stavke)
    //   GET /lista?limit=3&cursor=<kursor>    -> sledeca strana; kursor je sledeciKursor iz prethodnog odgovora
    //
    // Zasto ne "broj strane" (offset): kad se izmedju dva zahteva doda ili obrise stavka, offset
    // preskace ili ponavlja stavke, a Skip(N) sa velikim N je spor. Kursor kaze "daj mi stavke
    // starije od ove", pa je rezultat stabilan, a upit koristi indeks na primarnom kljucu.
    // Kursor je neprozirni string - klijent ga samo vraca, ne tumaci.
    public static class Paginacija
    {
        public const int PodrazumevanaVelicina = 3;
        public const int NajvecaVelicina = 50;

        public static string Kodiraj(int id)
            => Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(id.ToString()))
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        // null/prazan kursor = prva strana (id = null). false = neispravan kursor.
        public static bool TryDekodiraj(string? kursor, out int? id)
        {
            id = null;
            if (string.IsNullOrEmpty(kursor))
                return true;
            try
            {
                string b64 = kursor.Replace('-', '+').Replace('_', '/');
                b64 = b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '=');
                if (int.TryParse(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(b64)), out int parsiran) && parsiran > 0)
                {
                    id = parsiran;
                    return true;
                }
            }
            catch (FormatException) { }
            return false;
        }

        // upit: vec filtriran (i sa Include-ovima), bez sortiranja. Vraca limit stavki starijih od kursora.
        public static async Task<Strana<T>> UzmiAsync<T>(IQueryable<T> upit, int? posleId, int limit) where T : class, IImaId
        {
            limit = Math.Clamp(limit, 1, NajvecaVelicina);

            int? ukupno = posleId == null ? await upit.CountAsync() : null;

            IQueryable<T> strana = upit;
            if (posleId != null)
            {
                int granica = posleId.Value;
                strana = strana.Where(e => e.Id < granica);
            }

            // limit + 1: jedna stavka viska samo govori da ima jos, ne vraca se klijentu
            var stavke = await strana.OrderByDescending(e => e.Id).Take(limit + 1).ToListAsync();
            bool imaJos = stavke.Count > limit;
            if (imaJos)
                stavke.RemoveAt(limit);

            return new Strana<T>
            {
                Stavke = stavke,
                ImaJos = imaJos,
                SledeciKursor = imaJos ? Kodiraj(stavke[^1].Id) : null,
                Ukupno = ukupno
            };
        }
    }
}
