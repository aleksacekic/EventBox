using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Dogadjaj")]
    public class Dogadjaj : IImaId
    {
        [Key]
        public int Id {get; set;}
        // Kreator po ID-u (FK na Korisnik) - jedna kolona, bez duple "sene" kolone
        [Required]
        public int ID_Kreatora {get; set;}
        [ForeignKey(nameof(ID_Kreatora))]
        [JsonIgnore]
        public virtual Korisnik KreatorId {get; set;} //REFERENCA

        // Ime i slika kreatora se ne cuvaju u Dogadjaju (kopija bi zastarela pri promeni imena
        // ili slike), nego se citaju preko veze. Zato upiti koji vracaju dogadjaje rade
        // Include(d => d.KreatorId). JSON ostaje isti kao ranije.
        [NotMapped]
        public string UserName_Kreatora => KreatorId?.Korisnicko_Ime;
        [NotMapped]
        public string SlikaKorisnika => KreatorId?.KorisnikImage;

        [Required]
        public DateTime Datum_Objave {get; set;}
        [Required]
        [MaxLength(DogadjajZahtev.NaslovMax)]
        public string Naslov {get;set;}
        [Required]
        public DateTime Datum_Dogadjaja {get;set;}
        [Required]
        [MaxLength(5)] // "HH:mm"
        public string Vreme_pocetka {get;set;}
        [MaxLength(DogadjajZahtev.OpisMax)]
        public string Opis {get;set;}
        public int Broj_Zainteresovanih {get;set;}
        public int Broj_Mozda {get;set;}
        public int Broj_Nezainteresovanih {get;set;} 
        [Required]
        [MaxLength(50)]
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