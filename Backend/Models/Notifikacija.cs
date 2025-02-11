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

    [Required]
    public int KorisnikKojiReagujeId { get; set; }

    [Required]
    public string TipReakcije { get; set; }

    public string SadrzajReakcije { get; set; }

    [Required]
    public DateTime Vreme { get; set; } = DateTime.Now;
    
    [Required]
    [JsonIgnore]
    public virtual Korisnik Korisnik { get; set; }

    [Required]
    public int KorisnikCijaJeObjavaId {get; set;}

    }
}



