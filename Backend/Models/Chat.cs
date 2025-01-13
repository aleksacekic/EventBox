using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Chat")]
    public class Chat
    {
        [Key]
        public int Id {get;set;}

        [Required]
        public int PrviKorisnikId {get; set;}

        [Required]
        public int DrugiKorisnikId {get; set;}

        public virtual List<Poruka> Lista_Poruka {get; set;}
    }
}