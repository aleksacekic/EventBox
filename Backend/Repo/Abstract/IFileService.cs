namespace EventBoxApi.Repo.Abstract
{
    // Rezultat cuvanja slike: ime fajla u Uploads (uspeh) ili poruka o gresci za korisnika (neispravan fajl)
    public record ImageSaveResult(string? FileName, string? Error);

    public interface IFileService
    {
        // Proveri (velicina, pravi sadrzaj slike) pa sacuvaj pod novim nasumicnim imenom
        Task<ImageSaveResult> SaveImageAsync(IFormFile? fajl);

        // Obrisi sliku iz Uploads; null/prazno ili nepostojeci fajl se tiho preskacu
        void DeleteImage(string? ime);
    }
}
