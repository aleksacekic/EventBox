using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    [Table("Poruka")]
    public class Poruka
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int PosiljaocId { get; set; }
        
        [Required]
        public int PrimaocId { get; set; }
        
        [Required]
        [MaxLength(1000)]
        public string Sadrzaj { get; set; }
        
        [Required]
        public DateTime Vreme { get; set; } = DateTime.UtcNow;
        
        public bool JelProcitano { get; set; } = false;
    }

}