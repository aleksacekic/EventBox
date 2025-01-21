using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Notifikacija")]
    public class Notifikacija
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int Korisnik_Id { get; set; } // ID korisnika na koji se odnosi notifikacija

        [Required]
        public string TipNotifikacije { get; set; } // Tip notifikacije (komentar, reakcija, prijava)

        [Required]
        public string Sadrzaj { get; set; } // Sadržaj notifikacije (tekst komentara, tip reakcije, ili sadržaj prijave)

        [Required]
        public DateTime Vreme { get; set; } // Vremenski žig

        [ForeignKey("Korisnik_Id")]
        [JsonIgnore]
        public virtual Korisnik Korisnik { get; set; } // Referenca na korisnika
    }
}
