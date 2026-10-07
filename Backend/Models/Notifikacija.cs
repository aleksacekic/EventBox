using System;
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

    // FK na Dogadjaj (bez kaskade, vidi EventBoxContext); obrisan dogadjaj brise i svoje notifikacije
    [Required]
    public int DogadjajId { get; set; }

    // FK na Korisnik; null = ne pamti se ko je reagovao (npr. prijava dogadjaja je anonimna)
    public int? KorisnikKojiReagujeId { get; set; }

    [Required]
    public string TipReakcije { get; set; }

    public string SadrzajReakcije { get; set; }

    [Required]
    public DateTime Vreme { get; set; } = DateTime.Now;
    
    // Vlasnik objave kojoj notifikacija pripada (FK na Korisnik) - jedna kolona
    [Required]
    public int KorisnikCijaJeObjavaId {get; set;}

    [ForeignKey(nameof(KorisnikCijaJeObjavaId))]
    [JsonIgnore]
    public virtual Korisnik Korisnik { get; set; }

    }
}



