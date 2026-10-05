using System.Linq.Expressions;

namespace Models
{
    // Podaci o korisniku koji smeju da odu klijentu. Entitet Korisnik ima i Lozinku,
    // Lozinka_Hashirana, Token i Validnost - oni se NIKAD ne vracaju kroz API.
    // Imena svojstava su ista kao u entitetu, pa je JSON isti kao ranije.
    public class KorisnikJavniDto
    {
        public int Id { get; set; }
        public string Ime { get; set; }
        public string Prezime { get; set; }
        public string Korisnicko_Ime { get; set; }
        public DateTime Datum_rodjenja { get; set; }
        public string Email_Adresa { get; set; }
        public string? KorisnikImage { get; set; }

        // Izraz (a ne obicna metoda) da ga EF prevede u SQL i iz baze povuce samo ova polja.
        public static readonly Expression<Func<Korisnik, KorisnikJavniDto>> Projekcija = k => new KorisnikJavniDto
        {
            Id = k.Id,
            Ime = k.Ime,
            Prezime = k.Prezime,
            Korisnicko_Ime = k.Korisnicko_Ime,
            Datum_rodjenja = k.Datum_rodjenja,
            Email_Adresa = k.Email_Adresa,
            KorisnikImage = k.KorisnikImage,
        };
    }
}
