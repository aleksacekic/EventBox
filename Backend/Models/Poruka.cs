using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Poruka")]
    public class Poruka
    {
        [Key]
        public int Id {get;set;}
        
        [Required]
        [JsonIgnore]
        public virtual Chat Chat_Id {get;set;} 

        [Required]
        [JsonIgnore]
        public string Pisac_Poruke {get;set;}

        [Required]
        public string Tekst {get;set;}
    }
}