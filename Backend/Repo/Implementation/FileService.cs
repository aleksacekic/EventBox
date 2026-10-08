using EventBoxApi.Repo.Abstract;

namespace EventBoxApi.Repo.Implementation
{
    // Slike koje korisnici salju (profilna, slika dogadjaja), u folderu Uploads,
    // dostupne na /Resources/<ime> (vidi Program.cs).
    public class FileService : IFileService
    {
        public const long MaxVelicina = 5 * 1024 * 1024; // 5 MB

        private readonly string _folder;
        private readonly ILogger<FileService> _log;

        public FileService(IWebHostEnvironment env, ILogger<FileService> log)
        {
            _folder = Path.Combine(env.ContentRootPath, "Uploads");
            _log = log;
        }

        public async Task<RezultatSlike> SacuvajSlikuAsync(IFormFile? fajl)
        {
            if (fajl == null || fajl.Length == 0)
                return new(null, "Izaberite sliku.");
            if (fajl.Length > MaxVelicina)
                return new(null, $"Slika moze imati najvise {MaxVelicina / (1024 * 1024)} MB.");

            // Vrsta slike se odredjuje iz SADRZAJA (prvih bajtova), ne iz imena fajla: preimenovan
            // .exe ili .html u .png se odbija, a "SLIKA.JPG" ili slika bez ekstenzije prolazi.
            var zaglavlje = new byte[12];
            int procitano;
            await using (var s = fajl.OpenReadStream())
                procitano = await s.ReadAtLeastAsync(zaglavlje, zaglavlje.Length, throwOnEndOfStream: false);
            string? ekstenzija = PrepoznajSliku(zaglavlje.AsSpan(0, procitano));
            if (ekstenzija == null)
                return new(null, "Dozvoljene su samo JPG, PNG i WEBP slike.");

            Directory.CreateDirectory(_folder);
            string ime = Guid.NewGuid().ToString() + ekstenzija;
            await using (var izlaz = new FileStream(Path.Combine(_folder, ime), FileMode.CreateNew))
                await fajl.CopyToAsync(izlaz);
            return new(ime, null);
        }

        public void ObrisiSliku(string? ime)
        {
            if (string.IsNullOrWhiteSpace(ime))
                return;
            // GetFileName: ime fajla ne sme da izadje iz Uploads foldera (npr. "..\..\x")
            var putanja = Path.Combine(_folder, Path.GetFileName(ime));
            try
            {
                if (File.Exists(putanja))
                    File.Delete(putanja);
            }
            catch (IOException ex)
            {
                // Fajl zauzet ili nedostupan: zapis u bazi se svejedno brise, fajl ostaje kao visak
                _log.LogWarning(ex, "Slika {Ime} nije obrisana sa diska", ime);
            }
        }

        // "Magicni bajtovi" na pocetku fajla
        private static string? PrepoznajSliku(ReadOnlySpan<byte> b)
        {
            if (b.Length >= 3 && b[0] == 0xFF && b[1] == 0xD8 && b[2] == 0xFF)
                return ".jpg";
            if (b.Length >= 8 && b[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
                return ".png";
            if (b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8))
                return ".webp";
            return null;
        }
    }
}
