namespace Models
{
    // Pravila za email korisnika: ispravan format, najvise 254 karaktera, jedinstven (indeks u
    // EventBoxContext; kolacija baze ne razlikuje velika i mala slova, pa je i Ana@x.rs isto sto i ana@x.rs).
    public static class EmailAdresa
    {
        public const int MaxDuzina = 254;
        public const string IndeksJedinstvenosti = "IX_Korisnik_Email_Adresa";

        public static string Normalizuj(string? email) => (email ?? "").Trim();

        // null = ispravno, inace poruka o gresci
        public static string? Proveri(string email)
            => email.Length > MaxDuzina || !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email)
                ? "Unesite ispravnu email adresu."
                : null;

        // Da li je SaveChanges pao bas na jedinstvenosti emaila (a ne korisnickog imena)
        public static bool JeDuplikat(Microsoft.EntityFrameworkCore.DbUpdateException e)
            => KorisnickoIme.JeDuplikat(e) && e.InnerException!.Message.Contains(IndeksJedinstvenosti);
    }
}
