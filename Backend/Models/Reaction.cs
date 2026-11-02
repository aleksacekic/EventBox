using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    // Reakcija korisnika na dogadjaj (tabela Reactions)
    public class Reaction
    {
        // Dozvoljene vrednosti za Type (proverava kontroler, a i CHECK ogranicenje u bazi).
        // Vrednosti su upisane u bazi na srpskom; frontend prikazuje prevod.
        public static readonly string[] Types = { "Zainteresovan", "Mozda", "Nezainteresovan" };

        [Key]
        public int Id { get; set; }
        [Required]
        [MaxLength(20)]
        public string Type { get; set; }

        // Ko je reagovao (FK na Users). Par (UserId, EventId) je jedinstven:
        // jedan korisnik ima najvise jednu reakciju po dogadjaju (vidi EventBoxContext)
        public int UserId { get; set; }
        [ForeignKey(nameof(UserId))]
        [JsonIgnore]
        public virtual User User { get; set; }

        public int EventId { get; set; }
        [ForeignKey(nameof(EventId))]
        [JsonIgnore]
        public virtual Event Event { get; set; }
    }
}
