using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Reakcija")]
    public class Reakcija
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public string Tip {get;set;}
        [Required]
        public int Korisnik_ID {get;set;} 
        //Nema potrebe da bude referenca na korisnika jer
        //korisnik nece sadrzati listu svih reakcija koje je ikad napravio
        [Required]
        [JsonIgnore]
        public virtual Dogadjaj Dogadjaj_ID {get;set;} //REFERENCA

    }
}