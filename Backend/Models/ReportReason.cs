using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    // Jedna prijava dogadjaja: razlog, opis i ko je prijavio (tabela ReportReasons)
    public class ReportReason
    {
        // Dozvoljeni razlozi (isto kao opcije u formi za prijavu); proverava kontroler i CHECK u bazi.
        // Vrednosti su kodovi upisani u bazi; frontend prikazuje prevod.
        public static readonly string[] AllowedReasons =
            { "nepozeljan", "nasilje", "terorizam", "govor_mrznje", "lazne_informacije", "uznemiravanje", "ostalo" };

        [Key]
        public int Id { get; set; }

        public int ReportId { get; set; }
        [ForeignKey(nameof(ReportId))]
        [JsonIgnore]
        public virtual Report Report { get; set; }

        [Required]
        [MaxLength(30)]
        public string Reason { get; set; }
        // Opis (samo uz razlog "ostalo")
        [Required]
        [MaxLength(500)]
        public string Description { get; set; }

        // Ko je prijavio (FK na Users). Jedan korisnik moze jedan dogadjaj da prijavi samo jednom
        // (vidi EventBoxContext). null = stara prijava bez podatka o prijavljivacu ili obrisan nalog
        // (prijava ostaje, da moderacija ne izgubi dokaz).
        public int? ReporterId { get; set; }
        [ForeignKey(nameof(ReporterId))]
        [JsonIgnore]
        public virtual User? Reporter { get; set; }
    }
}
