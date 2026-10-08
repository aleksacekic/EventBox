namespace EventBoxApi.Repo.Abstract
{
    // Rezultat cuvanja slike: Ime fajla u Uploads (uspeh) ili Greska za korisnika (neispravan fajl)
    public record RezultatSlike(string? Ime, string? Greska);

    public interface IFileService
    {
        // Proveri (velicina, pravi sadrzaj slike) pa sacuvaj pod novim nasumicnim imenom
        Task<RezultatSlike> SacuvajSlikuAsync(IFormFile? fajl);

        // Obrisi sliku iz Uploads; null/prazno ili nepostojeci fajl se tiho preskacu
        void ObrisiSliku(string? ime);
    }
}
