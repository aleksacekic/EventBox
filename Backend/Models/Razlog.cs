using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Razlog")]
    public class Razlog
    {
        [Key]
        public int Id {get;set;}
        [Required]
        [JsonIgnore]
        public virtual Prijavljeni_dogadjaj Prijavljeni_dogadjaj_Id {get;set;}
        // Dozvoljeni razlozi (isto kao opcije u formi za prijavu); proverava kontroler i CHECK u bazi
        public static readonly string[] Dozvoljeni =
            { "nepozeljan", "nasilje", "terorizam", "govor_mrznje", "lazne_informacije", "uznemiravanje", "ostalo" };

        [Required]
        [MaxLength(30)]
        public string Razlog_prijave {get;set;}
        [MaxLength(500)]
        public string Opis {get;set;}

        // Ko je prijavio (FK na Korisnik). Jedan korisnik moze jedan dogadjaj da prijavi samo jednom
        // (vidi EventBoxContext). null = stara prijava bez podatka o prijavljivacu ili obrisan nalog
        // (prijava ostaje, da moderacija ne izgubi dokaz).
        public int? PrijavioId {get;set;}
        [ForeignKey(nameof(PrijavioId))]
        [JsonIgnore]
        public virtual Korisnik Prijavio {get;set;}
    }
}