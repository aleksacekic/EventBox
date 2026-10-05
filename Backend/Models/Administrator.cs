using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Administrator")]
    public class Administrator
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Ime {get;set;}
        [Required]
        public string Prezime {get;set;}
        [Required]
        public string Email_adresa {get;set;}
        [Required]
        [MaxLength(KorisnickoIme.MaxDuzina)] // jedinstveno (indeks u EventBoxContext)
        public string Korisnicko_ime {get;set;}
        [Required]
        public string Lozinka {get;set;} // PBKDF2 heš (vidi Auth/Lozinke.cs)
        // Sesija administratora (isto kao Korisnik.Token / Validnost)
        [MaxLength(64)]
        public string? Token {get;set;}
        public DateTime? Validnost {get;set;}
    }
}