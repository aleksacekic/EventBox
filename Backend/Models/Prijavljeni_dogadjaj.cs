using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Prijavljeni_dogadjaj")]
    public class Prijavljeni_dogadjaj
    {
        [Key]
        public int Id {get;set;}
        [Required]
        public virtual Dogadjaj Dogadjaj_Id {get;set;} //Ne treba JsonIgnore
        [Required]
        public int Broj_prijava {get;set;}

        public virtual List<Razlog> Razlozi {get;set;}

    }
}