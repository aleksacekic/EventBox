using Microsoft.EntityFrameworkCore;

namespace Models
{
    // Entiteti koji se stranice (sortiraju po Id-u, najnoviji prvi)
    public interface IHasId
    {
        int Id { get; }
    }

    // Jedna strana rezultata. JSON: { items, nextCursor, hasMore, total }
    public class Page<T>
    {
        public List<T> Items { get; set; } = new();
        // Kursor za sledecu stranu; null kad nema vise (hasMore == false)
        public string? NextCursor { get; set; }
        public bool HasMore { get; set; }
        // Ukupan broj stavki - samo uz PRVU stranu (bez kursora), inace null
        public int? Total { get; set; }
    }

    // Stranicenje kursorom (keyset), standardni nacin za "beskonacni skrol" i feedove.
    //
    //   GET /api/events?limit=3                    -> prva strana (najnovije stavke)
    //   GET /api/events?limit=3&cursor=<kursor>    -> sledeca strana; kursor je nextCursor iz prethodnog odgovora
    //
    // Zasto ne "broj strane" (offset): kad se izmedju dva zahteva doda ili obrise stavka, offset
    // preskace ili ponavlja stavke, a Skip(N) sa velikim N je spor. Kursor kaze "daj mi stavke
    // starije od ove", pa je rezultat stabilan, a upit koristi indeks na primarnom kljucu.
    // Kursor je neprozirni string - klijent ga samo vraca, ne tumaci.
    public static class Pagination
    {
        public const int DefaultPageSize = 3;
        public const int MaxPageSize = 50;

        public static string EncodeCursor(int id)
            => Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(id.ToString()))
                .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        // null/prazan kursor = prva strana (id = null). false = neispravan kursor.
        public static bool TryDecodeCursor(string? cursor, out int? id)
        {
            id = null;
            if (string.IsNullOrEmpty(cursor))
                return true;
            try
            {
                string b64 = cursor.Replace('-', '+').Replace('_', '/');
                b64 = b64.PadRight(b64.Length + (4 - b64.Length % 4) % 4, '=');
                if (int.TryParse(System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(b64)), out int parsed) && parsed > 0)
                {
                    id = parsed;
                    return true;
                }
            }
            catch (FormatException) { }
            return false;
        }

        // query: vec filtriran (i sa Include-ovima), bez sortiranja. Vraca limit stavki starijih od kursora.
        public static async Task<Page<T>> GetPageAsync<T>(IQueryable<T> query, int? afterId, int limit, bool includeTotal = true) where T : class, IHasId
        {
            limit = Math.Clamp(limit, 1, MaxPageSize);

            int? total = includeTotal && afterId == null ? await query.CountAsync() : null;

            IQueryable<T> page = query;
            if (afterId != null)
            {
                int boundary = afterId.Value;
                page = page.Where(e => e.Id < boundary);
            }

            // limit + 1: jedna stavka viska samo govori da ima jos, ne vraca se klijentu
            var items = await page.OrderByDescending(e => e.Id).Take(limit + 1).ToListAsync();
            bool hasMore = items.Count > limit;
            if (hasMore)
                items.RemoveAt(limit);

            return new Page<T>
            {
                Items = items,
                HasMore = hasMore,
                NextCursor = hasMore ? EncodeCursor(items[^1].Id) : null,
                Total = total
            };
        }
    }
}
