using EventBoxApi.Repo.Abstract;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Repo.Implementation
{
    // Slike koje korisnici salju (profilna, slika dogadjaja), u folderu Uploads,
    // dostupne na /resources/<ime> (vidi Program.cs).
    public class FileService : IFileService
    {
        public const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

        private readonly string _folder;
        private readonly ILogger<FileService> _log;
        private readonly IStringLocalizer<SharedResource> _t;

        public FileService(IWebHostEnvironment env, IConfiguration config, ILogger<FileService> log, IStringLocalizer<SharedResource> t)
        {
            _folder = GetFolder(config, env);
            _log = log;
            _t = t;
        }

        // Folder za slike: Uploads:Folder iz konfiguracije (lokalno "Uploads" pored projekta).
        // Na Azure-u se zadaje van foldera sa kodom (npr. Uploads__Folder=/home/data/uploads),
        // jer se folder sa kodom menja pri svakom deploy-u. Apsolutna putanja se koristi kakva jeste.
        public static string GetFolder(IConfiguration config, IWebHostEnvironment env)
            => Path.Combine(env.ContentRootPath, config["Uploads:Folder"] ?? "Uploads");

        public async Task<ImageSaveResult> SaveImageAsync(IFormFile? fajl)
        {
            if (fajl == null || fajl.Length == 0)
                return new(null, _t["ImageRequired"].Value);
            if (fajl.Length > MaxFileSize)
                return new(null, _t["ImageTooLarge", MaxFileSize / (1024 * 1024)].Value);

            // Vrsta slike se odredjuje iz SADRZAJA (prvih bajtova), ne iz imena fajla: preimenovan
            // .exe ili .html u .png se odbija, a "SLIKA.JPG" ili slika bez ekstenzije prolazi.
            var zaglavlje = new byte[12];
            int procitano;
            await using (var s = fajl.OpenReadStream())
                procitano = await s.ReadAtLeastAsync(zaglavlje, zaglavlje.Length, throwOnEndOfStream: false);
            string? ekstenzija = DetectImageExtension(zaglavlje.AsSpan(0, procitano));
            if (ekstenzija == null)
                return new(null, _t["ImageInvalidType"].Value);

            Directory.CreateDirectory(_folder);
            string ime = Guid.NewGuid().ToString() + ekstenzija;
            await using (var izlaz = new FileStream(Path.Combine(_folder, ime), FileMode.CreateNew))
                await fajl.CopyToAsync(izlaz);
            return new(ime, null);
        }

        public void DeleteImage(string? ime)
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
        private static string? DetectImageExtension(ReadOnlySpan<byte> b)
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
