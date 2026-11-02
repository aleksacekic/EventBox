using System.Text.RegularExpressions;
using Microsoft.Extensions.Localization;

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

        // null = ispravno, inace poruka o gresci (na jeziku zahteva)
        public static string? Validate(string ime, IStringLocalizer t)
        {
            if (ime.Length < MinLength || ime.Length > MaxLength)
                return t["UsernameLength", MinLength, MaxLength].Value;
            if (!AllowedPattern.IsMatch(ime))
                return t["UsernameChars"].Value;
            return null;
        }

        // Da li je SaveChanges pao na jedinstvenom indeksu (dva zahteva sa istim imenom u isto vreme)
        public static bool IsDuplicate(Microsoft.EntityFrameworkCore.DbUpdateException e)
            => e.InnerException is Microsoft.Data.SqlClient.SqlException { Number: 2601 or 2627 };
    }
}
