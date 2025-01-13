using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Notifikacija")]
    public class Notifikacija
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Poruka {get;set;}
        [Required]
        public DateTime Vreme {get;set;}
        [Required]
        [JsonIgnore]
        public virtual Korisnik Korisnik_Id {get;set;} //REFERENCA
    }
}