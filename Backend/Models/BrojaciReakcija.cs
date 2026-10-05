using Microsoft.EntityFrameworkCore;

namespace Models
{
    // Broj_Zainteresovanih / Broj_Mozda / Broj_Nezainteresovanih na Dogadjaju se nikad ne
    // menjaju sa ++/--, nego se uvek ponovo izracunaju iz tabele Reakcija. Jedan UPDATE sa
    // COUNT podupitima, pa brojaci ne mogu da "odlutaju" od stvarnog broja reakcija.
    public static class BrojaciReakcija
    {
        public static Task OsveziAsync(EventBoxContext context, params int[] dogadjajIds)
        {
            if (dogadjajIds.Length == 0)
                return Task.CompletedTask;
            // ID-jevi su int, pa je spajanje u IN listu bezbedno (nema SQL injekcije)
            string ids = string.Join(",", dogadjajIds.Distinct());
            return context.Database.ExecuteSqlRawAsync($@"
UPDATE d SET
    Broj_Zainteresovanih   = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Zainteresovan'),
    Broj_Mozda             = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Mozda'),
    Broj_Nezainteresovanih = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Nezainteresovan')
FROM Dogadjaj d
WHERE d.Id IN ({ids})");
        }
    }
}
