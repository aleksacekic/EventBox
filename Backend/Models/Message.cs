using System.ComponentModel.DataAnnotations;

namespace Models
{
    // Poruka u cetu (tabela Messages). Klijent dobija MessageDto.
    public class Message : IHasId
    {
        [Key]
        public int Id { get; set; }

        // Posiljalac i primalac (FK na Users, vidi EventBoxContext)
        public int SenderId { get; set; }
        public int RecipientId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; }

        // Vreme slanja (UTC)
        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;
    }
}
