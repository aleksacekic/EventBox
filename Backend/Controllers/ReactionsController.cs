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
    public class ReakcijaZahtev
    {
        public string Tip { get; set; } // Zainteresovan | Mozda | Nezainteresovan
    }

    // Reakcije na dogadjaje. Reakcija pripada ulogovanom korisniku (iz tokena), pa njegov ID nije u ruti:
    //   GET    /api/reactions/mine?eventIds=1,2,3     (moje reakcije na te dogadjaje)
    //   PUT    /api/events/{eventId}/reaction         (postavi ili promeni moju reakciju)
    //   DELETE /api/events/{eventId}/reaction         (povuci moju reakciju)
    //   DELETE /api/events/{eventId}/reactions        (sve reakcije dogadjaja, samo vlasnik)
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
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        // GET /api/reactions/mine?eventIds=1,2,3 - reakcije ulogovanog korisnika na zadatim
        // dogadjajima (ID-jevi odvojeni zarezom), jednim upitom
        [HttpGet]
        [EnableCors("CORS")]
        [Route("reactions/mine")]
        public async Task<ActionResult> GetMyReactions([FromQuery] string? eventIds)
        {
            int korisnikId = User.GetUserId();
            var delovi = (eventIds ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries);
            var lista = new List<int>();
            foreach (var d in delovi)
            {
                if (!int.TryParse(d, out int idDogadjaja))
                    return BadRequest(T("InvalidEventIds"));
                lista.Add(idDogadjaja);
            }
            var reakcije = await Context.Reakcije
                .Where(r => r.Korisnik_ID == korisnikId && lista.Contains(r.Dogadjaj_ID.Id))
                .Select(r => new { dogadjaj_ID = r.Dogadjaj_ID.Id, reakcija_ID = r.Id, tip = r.Tip })
                .ToListAsync();
            return Ok(reakcije);
        }

        // PUT /api/events/{eventId}/reaction  { "tip": "Mozda" } - postavlja reakciju ulogovanog
        // korisnika. Ako vec ima reakciju na tom dogadjaju, samo joj menja tip (nikad dve reakcije
        // istog korisnika na jednom dogadjaju). Brojaci se racunaju iz reakcija.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reaction")]
        public async Task<ActionResult> SetReaction(int eventId, [FromBody] ReakcijaZahtev zahtev)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i ne reaguje
            string? tip = zahtev?.Tip;
            if (tip == null || !Reakcija.Tipovi.Contains(tip))
                return BadRequest(T("UnknownReactionType", tip ?? ""));
            int korisnikId = User.GetUserId();
            Dogadjaj d = await Context.Dogadjaji.FindAsync(eventId);
            if (d == null)
                return NotFound();

            Reakcija r = await Context.Reakcije
                .FirstOrDefaultAsync(p => p.Korisnik_ID == korisnikId && p.Dogadjaj_ID.Id == eventId);
            if (r == null)
            {
                r = new Reakcija();
                r.Korisnik_ID = korisnikId;
                r.Dogadjaj_ID = d;
                Context.Reakcije.Add(r);
            }
            r.Tip = tip;

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

            await _notifications.NotifyOwnerAsync(d, korisnikId, NotificationType.Reaction, tip, reakcijaId: r.Id);

            return Ok(T("ReactionSet"));
        }

        // DELETE /api/events/{eventId}/reaction - brise reakciju ulogovanog korisnika, kog god tipa bila
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reaction")]
        public async Task<ActionResult> DeleteReaction(int eventId)
        {
            int korisnikId = User.GetUserId();
            Reakcija r = await Context.Reakcije
                .FirstOrDefaultAsync(p => p.Korisnik_ID == korisnikId && p.Dogadjaj_ID.Id == eventId);
            if (r == null)
                return NotFound();
            // Povucena reakcija povlaci i svoju notifikaciju
            var uklonjene = await _notifications.RemoveAsync(Context.Notifikacije.Where(n => n.ReakcijaId == r.Id));
            Context.Reakcije.Remove(r);
            await Context.SaveChangesAsync();
            await ReactionCounters.RefreshAsync(Context, eventId);
            await _notifications.NotifyRemovedAsync(uklonjene);
            return Ok(T("ReactionDeleted"));
        }

        // DELETE /api/events/{eventId}/reactions - sve reakcije dogadjaja (samo vlasnik dogadjaja)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/reactions")]
        public async Task<ActionResult> DeleteEventReactions(int eventId)
        {
            Dogadjaj d = await Context.Dogadjaji.FindAsync(eventId);
            if (d == null)
                return NotFound();
            if (d.ID_Kreatora != User.GetUserId())
                return Forbid();

            await Context.Notifikacije.Where(n => n.ReakcijaId != null && n.DogadjajId == eventId).ExecuteDeleteAsync();
            await Context.Reakcije.Where(r => r.Dogadjaj_ID.Id == eventId).ExecuteDeleteAsync();
            await ReactionCounters.RefreshAsync(Context, eventId);
            return Ok(T("EventReactionsDeleted"));
        }
    }
}
