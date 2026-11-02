using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Models
{
    // Dogadjaj (tabela Events). API ga vraca direktno, pa su veze ka drugim tabelama
    // sakrivene iz JSON-a ([JsonIgnore]), a ime i slika autora se dodaju kao izvedena polja.
    public class Event : IHasId
    {
        [Key]
        public int Id { get; set; }

        // Autor dogadjaja (FK na Users)
        public int CreatorId { get; set; }
        [ForeignKey(nameof(CreatorId))]
        [JsonIgnore]
        public virtual User Creator { get; set; }

        // Ime i slika autora se ne cuvaju u dogadjaju (kopija bi zastarela pri promeni imena
        // ili slike), nego se citaju preko veze. Zato upiti koji vracaju dogadjaje rade
        // Include(e => e.Creator).
        [NotMapped]
        public string CreatorUsername => Creator?.Username;
        [NotMapped]
        public string? CreatorImage => Creator?.ProfileImage;
        // Autor je blokiran: dogadjaj se korisnicima ne prikazuje, administrator ga vidi sa oznakom
        [NotMapped]
        public bool CreatorIsBlocked => Creator?.IsBlocked == true;

        // Datum objave (samo dan)
        public DateTime CreatedAt { get; set; }
        [Required]
        [MaxLength(EventRequest.TitleMax)]
        public string Title { get; set; }
        // Dan odrzavanja i vreme pocetka ("HH:mm")
        public DateTime Date { get; set; }
        [Required]
        [MaxLength(5)]
        public string StartTime { get; set; }
        [Required]
        [MaxLength(EventRequest.DescriptionMax)]
        public string Description { get; set; }
        // Vrednost iz EventRequest.Categories (na srpskom; frontend prikazuje prevod)
        [Required]
        [MaxLength(50)]
        public string Category { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        // Brojaci reakcija (racunaju se iz tabele Reactions, vidi ReactionCounters)
        public int InterestedCount { get; set; }
        public int MaybeCount { get; set; }
        public int NotInterestedCount { get; set; }

        // Ime fajla slike u Uploads (null = nema slike)
        public string? Image { get; set; }

        [JsonIgnore]
        public virtual List<Reaction> Reactions { get; set; }
        [JsonIgnore]
        public virtual List<Comment> Comments { get; set; }
    }
}
