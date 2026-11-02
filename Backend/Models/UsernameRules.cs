using System.Text.RegularExpressions;

namespace Models
{
    // Pravila za korisnicko ime (korisnik i administrator). Jedinstvenost cuva jedinstven
    // indeks u bazi; kolacija baze ne razlikuje velika i mala slova, pa su "Mika" i "mika" isto ime.
    public static class UsernameRules
    {
        public const int MinLength = 3;
        public const int MaxLength = 30;

        private static readonly Regex AllowedPattern = new(@"^[A-Za-z0-9._-]+$");

        public static string Normalize(string? ime) => (ime ?? "").Trim();

        // null = ispravno, inace poruka o gresci
        public static string? Validate(string ime)
        {
            if (ime.Length < MinLength || ime.Length > MaxLength)
                return $"Korisnicko ime mora imati od {MinLength} do {MaxLength} karaktera";
            if (!AllowedPattern.IsMatch(ime))
                return "Korisnicko ime sme da sadrzi samo slova (bez kvacica), cifre, tacku, crtu i donju crtu";
            return null;
        }

        // Da li je SaveChanges pao na jedinstvenom indeksu (dva zahteva sa istim imenom u isto vreme)
        public static bool IsDuplicate(Microsoft.EntityFrameworkCore.DbUpdateException e)
            => e.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 };
    }
}
