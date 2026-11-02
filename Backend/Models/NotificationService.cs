using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Microsoft.AspNetCore.SignalR;

namespace Models
{
    // Tipovi notifikacija (kolona Notifications.Type). Vrednosti su upisane u bazi, pa ostaju iste.
    public static class NotificationType
    {
        public const string Reaction = "Reakcija"; // Content = tip reakcije (Zainteresovan, Mozda...)
        public const string Comment = "Komentar";  // Content = tekst komentara
        public const string Report = "Prijava";    // Content = razlog prijave; ko je prijavio se ne otkriva
    }

    // Ono sto klijent dobija za notifikaciju - i u listi i uzivo kroz SignalR (isti oblik)
    public class NotificationDto
    {
        public int Id { get; set; }
        public int EventId { get; set; }
        public string EventTitle { get; set; }
        public string? ActorUsername { get; set; } // null za anonimno (prijava)
        public string Type { get; set; }
        public string? Content { get; set; }
        public DateTime CreatedAt { get; set; } // UTC

        public static readonly Expression<Func<Notification, NotificationDto>> Projection = n => new NotificationDto
        {
            Id = n.Id,
            EventId = n.EventId,
            EventTitle = n.Event.Title,
            ActorUsername = n.Actor != null ? n.Actor.Username : null,
            Type = n.Type,
            Content = n.Content,
            CreatedAt = n.CreatedAt
        };
    }

    // Poruka u cetu kako je vide klijenti (i u istoriji i uzivo)
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public int RecipientId { get; set; }
        public string Content { get; set; }
        public DateTime SentAt { get; set; } // UTC
        public bool IsRead { get; set; }

        public static MessageDto From(Message m) => new MessageDto
        {
            Id = m.Id, SenderId = m.SenderId, RecipientId = m.RecipientId,
            Content = m.Content, SentAt = m.SentAt, IsRead = m.IsRead
        };
    }

    // Sve sto server salje korisnicima uzivo ide odavde: PRVO upis u bazu, PA slanje kroz SignalR.
    // Ako primalac nije online, notifikacija/poruka je svejedno sacuvana i vidi je kad se vrati.
    // Imena dogadjaja koje klijent slusa (src/notifications.jsx): NotificationCreated,
    // NotificationUpdated, NotificationDeleted i MessageReceived.
    public class NotificationService
    {
        private readonly EventBoxContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ILogger<NotificationService> _log;

        public NotificationService(EventBoxContext context, IHubContext<NotificationHub> hub, ILogger<NotificationService> log)
        {
            _context = context;
            _hub = hub;
            _log = log;
        }

        // Notifikacija autoru dogadjaja. Za sopstvene akcije na svom dogadjaju se ne pravi.
        // Za reakciju postoji najvise jedna notifikacija: promena reakcije menja postojecu
        // (i pomera je na vrh), umesto da pravi novu.
        public async Task NotifyOwnerAsync(Event ev, int? actorId, string type, string? content,
                                           int? commentId = null, int? reactionId = null)
        {
            if (actorId == ev.CreatorId)
                return;

            Notification? n = reactionId == null ? null
                : await _context.Notifications.FirstOrDefaultAsync(x => x.ReactionId == reactionId);
            if (n == null)
            {
                n = new Notification
                {
                    EventId = ev.Id,
                    RecipientId = ev.CreatorId,
                    ActorId = actorId,
                    Type = type,
                    CommentId = commentId,
                    ReactionId = reactionId
                };
                _context.Notifications.Add(n);
            }
            n.Content = content ?? "";
            n.CreatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await SendAsync(ev.CreatorId, "NotificationCreated", await GetDtoAsync(n.Id));
        }

        // Komentar je izmenjen: notifikacija dobija novi tekst, ostaje na istom mestu u listi
        public async Task UpdateCommentNotificationAsync(Comment comment)
        {
            var n = await _context.Notifications.FirstOrDefaultAsync(x => x.CommentId == comment.Id);
            if (n == null)
                return;
            n.Content = comment.Text;
            await _context.SaveChangesAsync();
            await SendAsync(n.RecipientId, "NotificationUpdated", await GetDtoAsync(n.Id));
        }

        // Pre brisanja komentara/reakcije (FK je bez kaskade): brise njihovu notifikaciju u istom
        // SaveChanges kao i sam komentar/reakciju, a primaocu javlja posle (NotifyRemovedAsync)
        public async Task<List<(int Id, int RecipientId)>> RemoveAsync(IQueryable<Notification> which)
        {
            var list = await which.ToListAsync();
            _context.Notifications.RemoveRange(list);
            return list.Select(n => (n.Id, n.RecipientId)).ToList();
        }

        public async Task NotifyRemovedAsync(List<(int Id, int RecipientId)> removed)
        {
            foreach (var (id, recipientId) in removed)
                await SendAsync(recipientId, "NotificationDeleted", id);
        }

        private Task<NotificationDto> GetDtoAsync(int id)
            => _context.Notifications.Where(x => x.Id == id).Select(NotificationDto.Projection).FirstAsync();

        // Poruka je vec upisana u bazu (MessagesController); ovde se samo javlja primaocu
        public Task NotifyNewMessageAsync(Message m) => SendAsync(m.RecipientId, "MessageReceived", MessageDto.From(m));

        // Slanje uzivo je "najbolji pokusaj": ako ne uspe, podatak je vec u bazi, pa zahtev ne pada
        private async Task SendAsync(int userId, string eventName, object payload)
        {
            try
            {
                await _hub.Clients.User(userId.ToString()).SendAsync(eventName, payload);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "SignalR {EventName} korisniku {Id} nije poslat", eventName, userId);
            }
        }
    }
}
