using Microsoft.AspNetCore.Identity;

namespace EventBoxApi.Auth
{
    // Heshiranje i provera lozinki: PBKDF2 sa nasumicnom solju (PasswordHasher iz ASP.NET
    // Core Identity). Heš u bazi vec sadrzi sve potrebno (algoritam, broj iteracija, so),
    // pa nema posebne kolone za so.
    public static class Lozinke
    {
        private static readonly PasswordHasher<object> Hasher = new();

        public static string Hesiraj(string lozinka) => Hasher.HashPassword(null!, lozinka);

        // ponovoHesirati: heš je ispravan ali je napravljen sa slabijim podesavanjima
        // (npr. manje iteracija) - pozivalac ga zameni novim hešom.
        public static bool Proveri(string? sacuvano, string lozinka, out bool ponovoHesirati)
        {
            ponovoHesirati = false;

            // PasswordHasher V3 format uvek pocinje bajtom 0x01 -> "AQ" u Base64.
            // Sve drugo nije nas heš (i VerifyHashedPassword bi moglo da pukne na tome).
            if (string.IsNullOrEmpty(sacuvano) || lozinka == null || !sacuvano.StartsWith("AQ", StringComparison.Ordinal))
                return false;

            var rezultat = Hasher.VerifyHashedPassword(null!, sacuvano, lozinka);
            ponovoHesirati = rezultat == PasswordVerificationResult.SuccessRehashNeeded;
            return rezultat != PasswordVerificationResult.Failed;
        }
    }
}
