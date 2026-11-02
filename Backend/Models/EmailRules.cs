using Microsoft.Extensions.Localization;

namespace Models
{
    // Pravila za email korisnika: ispravan format, najvise 254 karaktera, jedinstven (indeks u
    // EventBoxContext; kolacija baze ne razlikuje velika i mala slova, pa je i Ana@x.rs isto sto i ana@x.rs).
    public static class EmailRules
    {
        public const int MaxLength = 254;
        public const string UniqueIndexName = "IX_Korisnik_Email_Adresa";

        public static string Normalize(string? email) => (email ?? "").Trim();

        // null = ispravno, inace poruka o gresci (na jeziku zahteva)
        public static string? Validate(string email, IStringLocalizer t)
            => email.Length > MaxLength || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email)
                ? t["InvalidEmail"].Value
                : null;

        // Da li je SaveChanges pao bas na jedinstvenosti emaila (a ne korisnickog imena)
        public static bool IsDuplicate(Microsoft.EntityFrameworkCore.DbUpdateException e)
            => UsernameRules.IsDuplicate(e) && e.InnerException!.Message.Contains(UniqueIndexName);
    }
}
