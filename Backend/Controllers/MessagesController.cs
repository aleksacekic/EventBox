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
    public class PorukaZahtev
    {
        public string Poruka { get; set; }
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
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        // GET /api/conversations - korisnici sa kojima je ulogovani korisnik komunicirao
        [HttpGet]
        [EnableCors("CORS")]
        [Route("conversations")]
        public async Task<IActionResult> GetConversationPartners()
        {
            int ja = User.GetUserId();
            var users = await Context.Poruke
                .Where(m => m.PosiljaocId == ja || m.PrimaocId == ja)
                .Select(m => m.PosiljaocId == ja ? m.PrimaocId : m.PosiljaocId)
                .Distinct()
                .ToListAsync();

            return Ok(users);
        }

        // GET /api/conversations/{userId}/messages - najnovije poruke prve, stranicenje kursorom
        // (Models/Pagination.cs):
        //   ?limit=20                 -> najnovijih 20
        //   ?limit=20&cursor=<kursor> -> sledecih 20 starijih (kursor = sledeciKursor iz prethodnog odgovora)
        // Odgovor: { stavke, sledeciKursor, imaJos }
        [HttpGet]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/messages")]
        public async Task<IActionResult> GetMessages(int userId, [FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            int ja = User.GetUserId();
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest(T("InvalidCursor"));

            var upit = Context.Poruke.Where(m => (m.PosiljaocId == ja && m.PrimaocId == userId) ||
                                                 (m.PosiljaocId == userId && m.PrimaocId == ja));
            return Ok(await Pagination.GetPageAsync(upit, posle, limit, includeTotal: false));
        }

        // POST /api/conversations/{userId}/messages  { "poruka": "..." } - salje se u ime ulogovanog korisnika
        [HttpPost]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/messages")]
        public async Task<IActionResult> SendMessage(int userId, [FromBody] PorukaZahtev zahtev)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nema cet
            int posiljaocId = User.GetUserId();

            // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
            if (string.IsNullOrWhiteSpace(zahtev?.Poruka))
                return BadRequest(T("MessageEmpty"));
            if (zahtev.Poruka.Length > 1000)
                return BadRequest(T("MessageTooLong", 1000));
            if (userId == posiljaocId)
                return BadRequest(T("CannotMessageSelf"));
            if (!await Context.Korisnici.AnyAsync(k => k.Id == userId))
                return NotFound(T("RecipientNotFound"));

            Poruka p = new Poruka
            {
                PrimaocId = userId,
                JelProcitano = false,
                PosiljaocId = posiljaocId,
                Sadrzaj = zahtev.Poruka,
                Vreme = DateTime.UtcNow
            };
            Context.Poruke.Add(p);
            await Context.SaveChangesAsync();
            // Tek posle upisa: primalac dobija poruku uzivo (ako je online)
            await _notifications.NotifyNewMessageAsync(p);
            return Ok(PorukaDto.From(p));
        }

        // PUT /api/conversations/{userId}/read - poruke koje je {userId} poslao ulogovanom korisniku
        // postaju procitane. Odgovor: { neprocitano } - koliko neprocitanih je ostalo ukupno.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("conversations/{userId:int}/read")]
        public async Task<IActionResult> MarkAsRead(int userId)
        {
            int ja = User.GetUserId();
            var neprocitanePoruke = await Context.Poruke
                .Where(m => m.PosiljaocId == userId && m.PrimaocId == ja && !m.JelProcitano)
                .ToListAsync();
            foreach (var poruka in neprocitanePoruke)
            {
                poruka.JelProcitano = true;
            }
            await Context.SaveChangesAsync();

            int preostalo = await Context.Poruke.CountAsync(m => m.PrimaocId == ja && !m.JelProcitano);
            return Ok(new { neprocitano = preostalo });
        }

        // GET /api/messages/unread-count
        [HttpGet]
        [EnableCors("CORS")]
        [Route("messages/unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            int ja = User.GetUserId();
            var brojPoruka = await Context.Poruke
             .Where(m => m.PrimaocId == ja && !m.JelProcitano)
             .CountAsync();

            return Ok(brojPoruka);

        }

        // DELETE /api/messages/{id} - brise samo posiljalac
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("messages/{id:int}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            var poruka = await Context.Poruke.FindAsync(id);
            if (poruka == null)
            {
                return NotFound(T("MessageNotFound"));
            }
            if (poruka.PosiljaocId != User.GetUserId())
                return Forbid(); // brise samo posiljalac
            Context.Poruke.Remove(poruka);
            await Context.SaveChangesAsync();
            return Ok(T("MessageDeleted"));
        }
    }
}
