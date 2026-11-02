using System.Text.RegularExpressions;
using Microsoft.Extensions.Localization;

namespace Models
{
    // Telo zahteva za pravljenje i izmenu dogadjaja (POST /api/events, PUT /api/events/{id}).
    // Autor i datum objave se NE salju - server ih postavlja sam.
    public class EventRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public DateTime? Date { get; set; }      // koristi se samo datum
        public string? StartTime { get; set; }   // "HH:mm"
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public const int TitleMin = 3, TitleMax = 100, DescriptionMax = 1000;

        // Iste vrednosti kao padajuca lista u formi (EventForm.jsx); upisuju se u bazu na srpskom
        public static readonly string[] Categories =
            { "Ostalo", "Zurka", "Humanitarna akcija", "Ekoloska akcija", "Sportski dogadjaj", "Koncert" };

        private static readonly Regex TimePattern = new(@"^([01]\d|2[0-3]):[0-5]\d$");

        // Ocisti razmake pa proveri. Vraca greske po polju (prazno = ispravno), u istom
        // obliku koji forma prikazuje ispod polja; poruke su na jeziku zahteva (t).
        // allowedPastDate: pri izmeni vec odrzanog dogadjaja datum moze ostati u proslosti.
        public Dictionary<string, string> Validate(IStringLocalizer t, DateTime? allowedPastDate = null)
        {
            Title = Title?.Trim();
            Description = Description?.Trim() ?? "";
            Category = Category?.Trim();
            StartTime = StartTime?.Trim();

            var errors = new Dictionary<string, string>();
            if (string.IsNullOrEmpty(Title) || Title.Length < TitleMin || Title.Length > TitleMax)
                errors["title"] = t["EventTitleLength", TitleMin, TitleMax].Value;
            if (Description.Length > DescriptionMax)
                errors["description"] = t["EventDescriptionLength", DescriptionMax].Value;
            if (Category == null || !Categories.Contains(Category))
                errors["category"] = t["EventCategory"].Value;

            var today = DateTime.Today;
            if (Date == null)
                errors["date"] = t["EventDateRequired"].Value;
            else if (Date.Value.Date < today && Date.Value.Date != allowedPastDate?.Date)
                errors["date"] = t["EventDatePast"].Value;
            else if (Date.Value.Date > today.AddYears(2))
                errors["date"] = t["EventDateTooFar"].Value;

            if (StartTime == null || !TimePattern.IsMatch(StartTime))
                errors["startTime"] = t["EventTimeRequired"].Value;

            if (Latitude == null || Longitude == null || Latitude < -90 || Latitude > 90
                || Longitude < -180 || Longitude > 180 || (Latitude == 0 && Longitude == 0))
                errors["location"] = t["EventLocationRequired"].Value;

            return errors;
        }

        public void ApplyTo(Event e)
        {
            e.Title = Title!;
            e.Description = Description ?? "";
            e.Category = Category!;
            e.Date = Date!.Value.Date;
            e.StartTime = StartTime!;
            e.Latitude = Latitude!.Value;
            e.Longitude = Longitude!.Value;
        }
    }
}
