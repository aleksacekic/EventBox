using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Komentar")]
    public class Komentar
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Tekst {get;set;}

        // Autor po ID-u (FK na Korisnik). Ime i slika autora se citaju preko ove veze,
        // pa se promena korisnickog imena ili slike odmah vidi i na komentarima.
        public int AutorId {get;set;}
        [ForeignKey(nameof(AutorId))]
        [JsonIgnore]
        public virtual Korisnik Autor {get;set;}

        // Vreme postavljanja (UTC)
        public DateTime Vreme {get;set;}

        [Required]
        [JsonIgnore]
        public virtual Dogadjaj Dogadjaj_Id {get;set;}
    }
}
