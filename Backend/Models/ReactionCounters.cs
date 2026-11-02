using Microsoft.EntityFrameworkCore;

namespace Models
{
    // InterestedCount / MaybeCount / NotInterestedCount na dogadjaju se nikad ne menjaju
    // sa ++/--, nego se uvek ponovo izracunaju iz tabele Reactions. Jedan UPDATE sa
    // COUNT podupitima, pa brojaci ne mogu da "odlutaju" od stvarnog broja reakcija.
    public static class ReactionCounters
    {
        public static Task RefreshAsync(EventBoxContext context, params int[] eventIds)
        {
            if (eventIds.Length == 0)
                return Task.CompletedTask;
            // ID-jevi su int, pa je spajanje u IN listu bezbedno (nema SQL injekcije)
            string ids = string.Join(",", eventIds.Distinct());
            return context.Database.ExecuteSqlRawAsync($@"
UPDATE e SET
    InterestedCount    = (SELECT COUNT(*) FROM Reactions r WHERE r.EventId = e.Id AND r.Type = N'Zainteresovan'),
    MaybeCount         = (SELECT COUNT(*) FROM Reactions r WHERE r.EventId = e.Id AND r.Type = N'Mozda'),
    NotInterestedCount = (SELECT COUNT(*) FROM Reactions r WHERE r.EventId = e.Id AND r.Type = N'Nezainteresovan')
FROM Events e
WHERE e.Id IN ({ids})");
        }
    }
}
