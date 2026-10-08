namespace Models
{

    public class RegistracijaZahtev
    {
        public string Ime { get; set; }
        public string Prezime { get; set; }
        public string KorisnickoIme { get; set; }
        public string Lozinka { get; set; }
        public DateTime DatumRodjenja { get; set; }
        public string EmailAdresa { get; set; }
    }

    public class PrijavaZahtev
    {
        public string KorisnickoIme { get; set; }
        public string Lozinka { get; set; }
    }

    public class IzmenaKorisnikaZahtev
    {
        public string Ime { get; set; }
        public string Prezime { get; set; }
        public string KorisnickoIme { get; set; }
        public string? Lozinka { get; set; } // nova lozinka; prazno = lozinka se ne menja
        public string? TrenutnaLozinka { get; set; } // obavezna samo kad se menja lozinka
        public DateTime DatumRodjenja { get; set; }
        public string EmailAdresa { get; set; }
    }

    // Brisanje naloga trazi lozinku - token sam nije dovoljan za nepovratnu akciju
    public class BrisanjeNalogaZahtev
    {
        public string? Lozinka { get; set; }
    }

    public class AdministratorZahtev
    {
        public string Ime { get; set; }
        public string Prezime { get; set; }
        public string EmailAdresa { get; set; }
        public string KorisnickoIme { get; set; }
        public string Lozinka { get; set; }
    }
}
