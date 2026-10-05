using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Reakcija")]
    public class Reakcija
    {
        // Dozvoljene vrednosti za Tip (proverava kontroler, a i CHECK ogranicenje u bazi)
        public static readonly string[] Tipovi = { "Zainteresovan", "Mozda", "Nezainteresovan" };

        [Key]
        public int Id {get;set;}
        [Required]
        [MaxLength(20)]
        public string Tip {get;set;}

        // Ko je reagovao (FK na Korisnik). Par (Korisnik_ID, dogadjaj) je jedinstven:
        // jedan korisnik ima najvise jednu reakciju po dogadjaju (vidi EventBoxContext)
        [Required]
        public int Korisnik_ID {get;set;}
        [ForeignKey(nameof(Korisnik_ID))]
        [JsonIgnore]
        public virtual Korisnik Korisnik {get;set;}

        [Required]
        [JsonIgnore]
        public virtual Dogadjaj Dogadjaj_ID {get;set;} //REFERENCA

    }
}
