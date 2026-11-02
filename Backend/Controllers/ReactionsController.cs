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
    public class ReactionRequest
    {
        public string Type { get; set; } // Zainteresovan | Mozda | Nezainteresovan
    }

    // Reakcije na dogadjaje. Reakcija pripada ulogovanom korisniku (iz tokena), pa njegov ID nije u ruti:
    //   GET    /api/reactions/mine?eventIds=1,2,3     (moje reakcije na te dogadjaje)
    //   PUT    /api/events/{eventId}/reaction         (postavi ili promeni moju reakciju)
    //   DELETE /api/events/{eventId}/reaction         (povuci moju reakciju)
    //   DELETE /api/events/{eventId}/reactions        (sve reakcije dogadjaja, samo autor)
    [Authorize]
    [ApiController]
    [Route("api")]
    public class ReactionsController : ControllerBase
    {
        public EventBoxContext Context;
        private readonly NotificationService _notifications;
        private readonly IStringLocalizer<SharedResource> _t;
        public ReactionsController(EventBoxContext context, NotificationService notifications, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            _notifications = notifications;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        // GET /api/reactions/mine?eventIds=1,2,3 - reakcije ulogovanog korisnika na zadatim
        // dogadjajima (ID-jevi odvojeni zarezom), jednim upitom
        [HttpGet]
        [EnableCors("CORS")]
        [Route("reactions/mine")]
        public async Task<ActionResult> GetMyReactions([FromQuery] string? eventIds)
        {
            int userId = User.GetUserId();
            var ids = new List<int>();
            foreach (var part in (eventIds ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                if (!int.TryParse(part, out int eventId))
                    return BadRequest(T("InvalidEventIds"));
                ids.Add(eventId);
            }
            var reactions = await Context.Reactions
                .Where(r => r.UserId == userId && ids.Contains(r.EventId))
                .Select(r => new { r.EventId, ReactionId = r.Id, r.Type })
                .ToListAsync();
            return Ok(reactions);
        }

        // PUT /api/events/{eventId}/reaction  { "type": "Mozda" } - postavlja reakciju ulogovanog
        // korisnika. Ako vec ima reakciju na tom dogadjaju, samo joj menja tip (nikad dve reakcije
        // istog korisnika na jednom dogadjaju). Brojaci se racunaju iz reakcija.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reaction")]
        public async Task<ActionResult> SetReaction(int eventId, [FromBody] ReactionRequest request)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i ne reaguje
            string? type = request?.Type;
            if (type == null || !Reaction.Types.Contains(type))
                return BadRequest(T("UnknownReactionType", type ?? ""));
            int userId = User.GetUserId();
            var ev = await Context.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();

            var reaction = await Context.Reactions.FirstOrDefaultAsync(r => r.UserId == userId && r.EventId == eventId);
            if (reaction == null)
            {
                reaction = new Reaction { UserId = userId, EventId = eventId };
                Context.Reactions.Add(reaction);
            }
            reaction.Type = type;

            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Dva istovremena zahteva istog korisnika: drugi udara u jedinstven indeks
                return Conflict(T("ReactionAlreadySet"));
            }
            await ReactionCounters.RefreshAsync(Context, eventId);

            await _notifications.NotifyOwnerAsync(ev, userId, NotificationType.Reaction, type, reactionId: reaction.Id);

            return Ok(T("ReactionSet"));
        }

        // DELETE /api/events/{eventId}/reaction - brise reakciju ulogovanog korisnika, kog god tipa bila
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reaction")]
        public async Task<ActionResult> DeleteReaction(int eventId)
        {
            int userId = User.GetUserId();
            var reaction = await Context.Reactions.FirstOrDefaultAsync(r => r.UserId == userId && r.EventId == eventId);
            if (reaction == null)
                return NotFound();
            // Povucena reakcija povlaci i svoju notifikaciju
            var removed = await _notifications.RemoveAsync(Context.Notifications.Where(n => n.ReactionId == reaction.Id));
            Context.Reactions.Remove(reaction);
            await Context.SaveChangesAsync();
            await ReactionCounters.RefreshAsync(Context, eventId);
            await _notifications.NotifyRemovedAsync(removed);
            return Ok(T("ReactionDeleted"));
        }

        // DELETE /api/events/{eventId}/reactions - sve reakcije dogadjaja (samo autor dogadjaja)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reactions")]
        public async Task<ActionResult> DeleteEventReactions(int eventId)
        {
            var ev = await Context.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId != User.GetUserId())
                return Forbid();

            await Context.Notifications.Where(n => n.ReactionId != null && n.EventId == eventId).ExecuteDeleteAsync();
            await Context.Reactions.Where(r => r.EventId == eventId).ExecuteDeleteAsync();
            await ReactionCounters.RefreshAsync(Context, eventId);
            return Ok(T("EventReactionsDeleted"));
        }
    }
}
