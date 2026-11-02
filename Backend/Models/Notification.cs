using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    // Notifikacija autoru dogadjaja (tabela Notifications): neko je reagovao, komentarisao ili
    // prijavio dogadjaj. Pravi je server (NotificationService), klijent dobija NotificationDto.
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        // Dogadjaj na koji se odnosi (FK bez kaskade, vidi EventBoxContext)
        public int EventId { get; set; }
        [JsonIgnore]
        public virtual Event Event { get; set; }

        // Ko je notifikaciju dobio - autor dogadjaja (FK na Users)
        public int RecipientId { get; set; }
        [ForeignKey(nameof(RecipientId))]
        [JsonIgnore]
        public virtual User Recipient { get; set; }

        // Ko je reagovao (FK na Users); null = ne otkriva se (prijava dogadjaja je anonimna)
        public int? ActorId { get; set; }
        [JsonIgnore]
        public virtual User? Actor { get; set; }

        // NotificationType: Reakcija, Komentar ili Prijava (vrednosti su upisane u bazi)
        [Required]
        public string Type { get; set; }
        // Tip reakcije, tekst komentara ili razlog prijave
        [Required]
        public string Content { get; set; }

        // Vreme nastanka (UTC)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Na koji komentar/reakciju se notifikacija odnosi (FK, null za prijave i stare zapise).
        // Kad autor obrise/izmeni komentar ili povuce/promeni reakciju, menja se i notifikacija.
        public int? CommentId { get; set; }
        [JsonIgnore]
        public virtual Comment? Comment { get; set; }

        public int? ReactionId { get; set; }
        [JsonIgnore]
        public virtual Reaction? Reaction { get; set; }
    }
}
