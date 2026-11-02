using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    public class MessageRequest
    {
        public string Content { get; set; }
    }

    // Cet. Razgovor je uvek izmedju ulogovanog korisnika (iz tokena) i korisnika {userId}:
    //   GET  /api/conversations                         (sa kim sam se dopisivao - ID-jevi)
    //   GET  /api/conversations/{userId}/messages       (poruke razgovora)
    //   POST /api/conversations/{userId}/messages       (posalji poruku)
    //   PUT  /api/conversations/{userId}/read           (oznaci njegove poruke kao procitane)
    //   GET  /api/messages/unread-count                 (broj neprocitanih, za znacku u headeru)
    //   DELETE /api/messages/{id}                       (obrisi svoju poruku)
    [Authorize]
    [ApiController]
    [Route("api")]
    public class MessagesController : ControllerBase
    {
        public const int MaxContentLength = 1000;

        public EventBoxContext Context;
        private readonly NotificationService _notifications;
        private readonly IStringLocalizer<SharedResource> _t;
        public MessagesController(EventBoxContext context, NotificationService notifications, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            _notifications = notifications;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        // GET /api/conversations - korisnici sa kojima je ulogovani korisnik komunicirao
        [HttpGet]
        [EnableCors("CORS")]
        [Route("conversations")]
        public async Task<IActionResult> GetConversationPartners()
        {
            int me = User.GetUserId();
            var userIds = await Context.Messages
                .Where(m => m.SenderId == me || m.RecipientId == me)
                .Select(m => m.SenderId == me ? m.RecipientId : m.SenderId)
                .Distinct()
                .ToListAsync();

            return Ok(userIds);
        }

        // GET /api/conversations/{userId}/messages - najnovije poruke prve, stranicenje kursorom
        // (Models/Pagination.cs):
        //   ?limit=20                 -> najnovijih 20
        //   ?limit=20&cursor=<kursor> -> sledecih 20 starijih (kursor = nextCursor iz prethodnog odgovora)
        // Odgovor: { items, nextCursor, hasMore }
        [HttpGet]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/messages")]
        public async Task<IActionResult> GetMessages(int userId, [FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            int me = User.GetUserId();
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));

            var query = Context.Messages.Where(m => (m.SenderId == me && m.RecipientId == userId) ||
                                                   (m.SenderId == userId && m.RecipientId == me));
            return Ok(await Pagination.GetPageAsync(query, after, limit, includeTotal: false));
        }

        // POST /api/conversations/{userId}/messages  { "content": "..." } - salje se u ime ulogovanog korisnika
        [HttpPost]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/messages")]
        public async Task<IActionResult> SendMessage(int userId, [FromBody] MessageRequest request)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nema cet
            int senderId = User.GetUserId();

            // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
            if (string.IsNullOrWhiteSpace(request?.Content))
                return BadRequest(T("MessageEmpty"));
            if (request.Content.Length > MaxContentLength)
                return BadRequest(T("MessageTooLong", MaxContentLength));
            if (userId == senderId)
                return BadRequest(T("CannotMessageSelf"));
            if (!await Context.Users.AnyAsync(u => u.Id == userId))
                return NotFound(T("RecipientNotFound"));

            var message = new Message
            {
                SenderId = senderId,
                RecipientId = userId,
                Content = request.Content,
                SentAt = DateTime.UtcNow,
                IsRead = false,
            };
            Context.Messages.Add(message);
            await Context.SaveChangesAsync();
            // Tek posle upisa: primalac dobija poruku uzivo (ako je online)
            await _notifications.NotifyNewMessageAsync(message);
            return Ok(MessageDto.From(message));
        }

        // PUT /api/conversations/{userId}/read - poruke koje je {userId} poslao ulogovanom korisniku
        // postaju procitane. Odgovor: { unreadCount } - koliko neprocitanih je ostalo ukupno.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int userId)
        {
            int me = User.GetUserId();
            var unread = await Context.Messages
                .Where(m => m.SenderId == userId && m.RecipientId == me && !m.IsRead)
                .ToListAsync();
            foreach (var message in unread)
                message.IsRead = true;
            await Context.SaveChangesAsync();

            int remaining = await Context.Messages.CountAsync(m => m.RecipientId == me && !m.IsRead);
            return Ok(new { unreadCount = remaining });
        }

        // GET /api/messages/unread-count
        [HttpGet]
        [EnableCors("CORS")]
        [Route("messages/unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int me = User.GetUserId();
            int count = await Context.Messages.CountAsync(m => m.RecipientId == me && !m.IsRead);
            return Ok(count);
        }

        // DELETE /api/messages/{id} - brise samo posiljalac
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("messages/{id:int}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var message = await Context.Messages.FindAsync(id);
            if (message == null)
                return NotFound(T("MessageNotFound"));
            if (message.SenderId != User.GetUserId())
                return Forbid(); // brise samo posiljalac
            Context.Messages.Remove(message);
            await Context.SaveChangesAsync();
            return Ok(T("MessageDeleted"));
        }
    }
}
