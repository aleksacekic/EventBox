using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Komentar")]
    public class Komentar
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Tekst {get;set;}
        [Required]
        public string Username_Korisnika {get;set;} 
        [Required]
        [JsonIgnore]
        public virtual Dogadjaj Dogadjaj_Id {get;set;}
	public string SlikaKorisnika {get; set;}
    }
}