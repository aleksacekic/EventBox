using Microsoft.AspNetCore.Identity;

namespace EventBoxApi.Auth
{
    // Heshiranje i provera lozinki: PBKDF2 sa nasumicnom solju (PasswordHasher iz ASP.NET
    // Core Identity). Heš u bazi vec sadrzi sve potrebno (algoritam, broj iteracija, so),
    // pa nema posebne kolone za so.
    public static class Passwords
    {
        private static readonly PasswordHasher<object> Hasher = new();

        public static string Hash(string lozinka) => Hasher.HashPassword(null!, lozinka);

        // needsRehash: heš je ispravan ali je napravljen sa slabijim podesavanjima
        // (npr. manje iteracija) - pozivalac ga zameni novim hešom.
        public static bool Verify(string? sacuvano, string lozinka, out bool needsRehash)
        {
            needsRehash = false;

            // PasswordHasher V3 format uvek pocinje bajtom 0x01 -> "AQ" u Base64.
            // Sve drugo nije nas heš (i VerifyHashedPassword bi moglo da pukne na tome).
            if (string.IsNullOrEmpty(sacuvano) || lozinka == null || !sacuvano.StartsWith("AQ", StringComparison.Ordinal))
                return false;

            var rezultat = Hasher.VerifyHashedPassword(null!, sacuvano, lozinka);
            needsRehash = rezultat == PasswordVerificationResult.SuccessRehashNeeded;
            return rezultat != PasswordVerificationResult.Failed;
        }
    }
}
