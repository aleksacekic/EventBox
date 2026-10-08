using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Korisnik")]
    public class Korisnik : IImaId
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Ime { get; set; }
        [Required]
        public string Prezime { get; set; }
        [Required]
        [MaxLength(KorisnickoIme.MaxDuzina)] // jedinstveno (indeks u EventBoxContext)
        public string Korisnicko_Ime { get; set; }
        [Required]
        public string Lozinka_Hashirana { get; set; }
        [Required]
        public DateTime Datum_rodjenja { get; set; }
        [Required]
        [MaxLength(EmailAdresa.MaxDuzina)] // jedinstveno (indeks u EventBoxContext)
        public string Email_Adresa { get; set; }
        [Required]
        [Range(-1, 0)] //-1 = BLOKIRAN, 0 = NIJE BLOKIRAN  
        public int Blokiran { get; set; }

        [Required]
        [MaxLength(64)] // 32 nasumicna bajta kao hex; jedinstveno (indeks u EventBoxContext)
        public string Token { get; set; }
        [Required]
        public DateTime Validnost { get; set; }

        public virtual List<Dogadjaj> Kreirani_Dogadjaji { get; set; }
        public virtual List<Notifikacija> Lista_Notifikacija { get; set; }

        public string? KorisnikImage { get; set; }

    }
}