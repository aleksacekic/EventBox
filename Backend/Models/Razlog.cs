using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Razlog")]
    public class Razlog
    {
        [Key]
        public int Id {get;set;}
        [Required]
        [JsonIgnore]
        public virtual Prijavljeni_dogadjaj Prijavljeni_dogadjaj_Id {get;set;}
        [Required]
        public string Razlog_prijave {get;set;}
        public string Opis {get;set;}
    }
}