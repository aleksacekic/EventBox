using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Dogadjaj")]
    public class Dogadjaj
    {
        [Key]
        public int Id {get; set;}
        [Required]
        [JsonIgnore]
        public virtual Korisnik KreatorId {get; set;} //REFERENCA
        [Required]
        public int ID_Kreatora {get; set;}
        [Required]
        public string UserName_Kreatora {get; set;}
        [Required]
        public DateTime Datum_Objave {get; set;}
	public string SlikaKorisnika {get; set;}
        [Required] 
        public string Naslov {get;set;}
        [Required]
        public DateTime Datum_Dogadjaja {get;set;}
        [Required]
        public string Vreme_pocetka {get;set;}
        public string Opis {get;set;}
        public int Broj_Zainteresovanih {get;set;}
        public int Broj_Mozda {get;set;}
        public int Broj_Nezainteresovanih {get;set;} 
        [Required]
        public string Kategorija {get;set;}
        [Required]
        public double X {get;set;}
        [Required]
        public double Y {get;set;}
	


        public virtual List<Reakcija> Lista_Reakcija {get;set;}
        public virtual List<Komentar> Lista_Komentara {get;set;}

        public string? DogadjajImage {get;set;}
        [NotMapped]
        public IFormFile ImageFile {get;set;}
    }
}