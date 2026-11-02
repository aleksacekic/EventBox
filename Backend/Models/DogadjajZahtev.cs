using System.Text.RegularExpressions;
using Microsoft.Extensions.Localization;

namespace Models
{
    // Telo zahteva za pravljenje i izmenu dogadjaja (POST /api/events,
    // PUT /api/events/{id}). Ranije je sve islo kroz URL, pa su /, ? i # u opisu
    // kvarili rutu, a duzina je bila ogranicena duzinom adrese.
    // Kreator i datum objave se NE salju - server ih postavlja sam.
    public class DogadjajZahtev
    {
        public string? Naslov { get; set; }
        public string? Opis { get; set; }
        public string? Kategorija { get; set; }
        public DateTime? DatumDogadjaja { get; set; } // koristi se samo datum
        public string? VremePocetka { get; set; }     // "HH:mm"
        public double? X { get; set; }                // geografska sirina
        public double? Y { get; set; }                // geografska duzina

        public const int NaslovMin = 3, NaslovMax = 100, OpisMax = 1000;

        // Iste vrednosti kao padajuca lista u formi (EventForm.jsx)
        public static readonly string[] Kategorije =
            { "Ostalo", "Zurka", "Humanitarna akcija", "Ekoloska akcija", "Sportski dogadjaj", "Koncert" };

        private static readonly Regex Vreme = new(@"^([01]\d|2[0-3]):[0-5]\d$");

        // Ocisti razmake pa proveri. Vraca greske po polju (prazno = ispravno), u istom
        // obliku koji forma prikazuje ispod polja; poruke su na jeziku zahteva (t).
        // allowedPastDate: pri izmeni vec odrzanog dogadjaja datum moze ostati u proslosti.
        public Dictionary<string, string> Validate(IStringLocalizer t, DateTime? allowedPastDate = null)
        {
            Naslov = Naslov?.Trim();
            Opis = Opis?.Trim() ?? "";
            Kategorija = Kategorija?.Trim();
            VremePocetka = VremePocetka?.Trim();

            var greske = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(Naslov) || Naslov.Length < NaslovMin || Naslov.Length > NaslovMax)
                greske["naslov"] = t["EventTitleLength", NaslovMin, NaslovMax].Value;
            if (Opis.Length > OpisMax)
                greske["opis"] = t["EventDescriptionLength", OpisMax].Value;
            if (Kategorija == null || !Kategorije.Contains(Kategorija))
                greske["kategorija"] = t["EventCategory"].Value;

            var danas = DateTime.Today;
            if (DatumDogadjaja == null)
                greske["datum"] = t["EventDateRequired"].Value;
            else if (DatumDogadjaja.Value.Date < danas && DatumDogadjaja.Value.Date != allowedPastDate?.Date)
                greske["datum"] = t["EventDatePast"].Value;
            else if (DatumDogadjaja.Value.Date > danas.AddYears(2))
                greske["datum"] = t["EventDateTooFar"].Value;

            if (VremePocetka == null || !Vreme.IsMatch(VremePocetka))
                greske["vreme"] = t["EventTimeRequired"].Value;

            if (X == null || Y == null || X < -90 || X > 90 || Y < -180 || Y > 180 || (X == 0 && Y == 0))
                greske["lokacija"] = t["EventLocationRequired"].Value;

            return greske;
        }

        public void ApplyTo(Dogadjaj d)
        {
            d.Naslov = Naslov!;
            d.Opis = Opis ?? "";
            d.Kategorija = Kategorija!;
            d.Datum_Dogadjaja = DatumDogadjaja!.Value.Date;
            d.Vreme_pocetka = VremePocetka!;
            d.X = X!.Value;
            d.Y = Y!.Value;
        }
    }
}
