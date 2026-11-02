using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    // Komentar na dogadjaju (tabela Comments). Klijent dobija CommentDto.
    public class Comment : IHasId
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string Text { get; set; }

        // Autor (FK na Users). Ime i slika autora se citaju preko ove veze,
        // pa se promena korisnickog imena ili slike odmah vidi i na komentarima.
        public int AuthorId { get; set; }
        [ForeignKey(nameof(AuthorId))]
        [JsonIgnore]
        public virtual User Author { get; set; }

        // Vreme postavljanja (UTC)
        public DateTime CreatedAt { get; set; }

        public int EventId { get; set; }
        [ForeignKey(nameof(EventId))]
        [JsonIgnore]
        public virtual Event Event { get; set; }
    }
}
