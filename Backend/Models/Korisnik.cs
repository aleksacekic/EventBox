using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Korisnik")]
    public class Korisnik 
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Ime {get;set;}
        [Required]
        public string Prezime {get;set;}
        [Required]
        public string Korisnicko_Ime {get;set;}
        [Required]
        public string Lozinka {get;set;}
        [Required]
        public string Lozinka_Hashirana {get;set;}
        [Required]
        public DateTime Datum_rodjenja {get;set;}
        [Required]
        public string Email_Adresa {get;set;} 
        [Required]
        [Range(-1,0)] //-1 = BLOKIRAN, 0 = NIJE BLOKIRAN  
        public int Blokiran {get;set;}

        [Required]
        public string Token {get;set;}
        [Required]
        public DateTime Validnost {get;set;}

        public virtual List<Dogadjaj> Kreirani_Dogadjaji {get;set;}
        public virtual List<Notifikacija> Lista_Notifikacija {get;set;}

        public string? KorisnikImage {get;set;}
        [NotMapped]
        public IFormFile ImageFile {get;set;}

    }
}