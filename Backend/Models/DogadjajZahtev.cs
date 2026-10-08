using System.Text.RegularExpressions;

namespace Models
{
    // Telo zahteva za pravljenje i izmenu dogadjaja (POST /Dogadjaj/DodajDogadjaj,
    // PUT /Dogadjaj/IzmeniDogadjaj/{id}). Ranije je sve islo kroz URL, pa su /, ? i # u opisu
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

        // Iste vrednosti kao padajuca lista u formi (NapraviDogadjaj.jsx)
        public static readonly string[] Kategorije =
            { "Ostalo", "Zurka", "Humanitarna akcija", "Ekoloska akcija", "Sportski dogadjaj", "Koncert" };

        private static readonly Regex Vreme = new(@"^([01]\d|2[0-3]):[0-5]\d$");

        // Ocisti razmake pa proveri. Vraca greske po polju (prazno = ispravno), u istom
        // obliku koji forma prikazuje ispod polja.
        // dozvoliProsliDatum: pri izmeni vec odrzanog dogadjaja datum moze ostati u proslosti.
        public Dictionary<string, string> Proveri(DateTime? dozvoliProsliDatum = null)
        {
            Naslov = Naslov?.Trim();
            Opis = Opis?.Trim() ?? "";
            Kategorija = Kategorija?.Trim();
            VremePocetka = VremePocetka?.Trim();

            var greske = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(Naslov) || Naslov.Length < NaslovMin || Naslov.Length > NaslovMax)
                greske["naslov"] = $"Naziv mora imati od {NaslovMin} do {NaslovMax} karaktera.";
            if (Opis.Length > OpisMax)
                greske["opis"] = $"Opis moze imati najvise {OpisMax} karaktera.";
            if (Kategorija == null || !Kategorije.Contains(Kategorija))
                greske["kategorija"] = "Izaberite kategoriju sa liste.";

            var danas = DateTime.Today;
            if (DatumDogadjaja == null)
                greske["datum"] = "Izaberite datum.";
            else if (DatumDogadjaja.Value.Date < danas && DatumDogadjaja.Value.Date != dozvoliProsliDatum?.Date)
                greske["datum"] = "Datum ne moze biti u proslosti.";
            else if (DatumDogadjaja.Value.Date > danas.AddYears(2))
                greske["datum"] = "Datum moze biti najvise dve godine unapred.";

            if (VremePocetka == null || !Vreme.IsMatch(VremePocetka))
                greske["vreme"] = "Izaberite vreme pocetka.";

            if (X == null || Y == null || X < -90 || X > 90 || Y < -180 || Y > 180 || (X == 0 && Y == 0))
                greske["lokacija"] = "Oznacite lokaciju na mapi.";

            return greske;
        }

        public void PrimeniNa(Dogadjaj d)
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
