using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    // Dogadjaji: feed, pretraga, jedan dogadjaj, pravljenje, izmena, brisanje i slika.
    // Rute pocinju sa /api/events (komentari, reakcije i prijave dogadjaja su u svojim kontrolerima).
    [Authorize]
    [ApiController]
    [Route("api/events")]
    public class EventsController : ControllerBase
    {
        public EventBoxContext Context;
        public IFileService _fileService;
        private readonly IStringLocalizer<SharedResource> _t;
        public EventsController(EventBoxContext context, IFileService fs, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            this._fileService = fs;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        // Liste dogadjaja: najnoviji prvi, stranicenje kursorom (Models/Pagination.cs).
        //   ?limit=3                -> prva strana
        //   ?limit=3&cursor=<kursor> -> sledeca (kursor = nextCursor iz prethodnog odgovora)
        // Odgovor: { items, nextCursor, hasMore, total }  (total samo uz prvu stranu)
        // Sadrzaj blokiranih korisnika se ne prikazuje (ne brise se - posle odblokiranja je opet tu).
        // Administrator vidi sve.
        private IQueryable<Event> OnlyVisible(IQueryable<Event> query)
            => User.IsAdmin() ? query : query.Where(e => !e.Creator.IsBlocked);

        private async Task<ActionResult> GetEventPage(IQueryable<Event> query, int limit, string? cursor)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));
            return Ok(await Pagination.GetPageAsync(query.Include(e => e.Creator), after, limit));
        }

        // GET /api/events - feed: predstojeci dogadjaji
        [HttpGet]
        [EnableCors("CORS")]
        public Task<ActionResult> GetUpcomingEvents([FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            DateTime today = DateTime.Today;
            return GetEventPage(OnlyVisible(Context.Events.Where(e => e.Date >= today)), limit, cursor);
        }

        // GET /api/events/by-date?date=2026-11-02 - dogadjaji tog dana
        [HttpGet]
        [EnableCors("CORS")]
        [Route("by-date")]
        public Task<ActionResult> GetEventsByDate([FromQuery] DateTime date, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            DateTime from = date.Date;
            DateTime to = from.AddDays(1);
            return GetEventPage(OnlyVisible(Context.Events.Where(e => e.Date >= from && e.Date < to)), limit, cursor);
        }

        // GET /api/events/search?title=koncert - predstojeci dogadjaji ciji naziv sadrzi tekst
        [HttpGet]
        [EnableCors("CORS")]
        [Route("search")]
        public async Task<ActionResult> SearchEvents([FromQuery] string title, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                return BadRequest(T("TitleRequired"));
            DateTime today = DateTime.Today;
            return await GetEventPage(OnlyVisible(Context.Events.Where(e => e.Date >= today && e.Title.Contains(title))), limit, cursor);
        }

        // GET /api/events/all?title= - admin: SVI dogadjaji, i oni koji su prosli (feed korisnika
        // prikazuje samo predstojece), najnoviji prvi. ?title= opciono suzava po nazivu.
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("all")]
        public Task<ActionResult> GetAllEvents([FromQuery] string? title, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            IQueryable<Event> query = Context.Events;
            if (!string.IsNullOrWhiteSpace(title))
            {
                string search = title.Trim();
                query = query.Where(e => e.Title.Contains(search));
            }
            return GetEventPage(query, limit, cursor);
        }

        // GET /api/events/{id}
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> GetEvent(int id)
        {
            var ev = await Context.Events.Include(e => e.Creator).FirstOrDefaultAsync(e => e.Id == id);
            // Dogadjaj blokiranog korisnika je sakriven (kao da ne postoji) za sve osim administratora
            if (ev == null || (ev.CreatorIsBlocked && !User.IsAdmin()))
                return NotFound(T("EventNotFound", id));

            return Ok(ev);
        }

        // POST /api/events - novi dogadjaj ulogovanog korisnika. Podaci idu u telu (EventRequest);
        // autor i datum objave postavlja server. Neispravan unos -> 400 { message, errors: { polje: poruka } }.
        [HttpPost]
        [EnableCors("CORS")]
        public async Task<ActionResult> CreateEvent([FromBody] EventRequest request)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i nema dogadjaje
            if (request == null)
                return BadRequest(T("MissingEventData"));
            var errors = request.Validate(_t);
            if (errors.Count > 0)
                return BadRequest(new { message = T("CheckInput"), errors });

            var ev = new Event
            {
                CreatorId = User.GetUserId(),
                CreatedAt = DateTime.Today,
                Image = null,
            };
            request.ApplyTo(ev);
            Context.Events.Add(ev);
            await Context.SaveChangesAsync();

            // isti oblik kao u listama (sa imenom i slikom autora), da kartica odmah ima sve
            await Context.Entry(ev).Reference(e => e.Creator).LoadAsync();
            return Ok(ev);
        }

        // PUT /api/events/{id} - izmena dogadjaja (samo autor), isto telo i ista pravila kao pri
        // pravljenju. Datum vec odrzanog dogadjaja moze ostati isti, iako je u proslosti.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> UpdateEvent(int id, [FromBody] EventRequest request)
        {
            var ev = await Context.Events.Include(e => e.Creator).FirstOrDefaultAsync(e => e.Id == id);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId != User.GetUserId())
                return Forbid();
            if (request == null)
                return BadRequest(T("MissingEventData"));
            var errors = request.Validate(_t, allowedPastDate: ev.Date);
            if (errors.Count > 0)
                return BadRequest(new { message = T("CheckInput"), errors });

            request.ApplyTo(ev);
            await Context.SaveChangesAsync();
            return Ok(ev);
        }

        // DELETE /api/events/{id} - brise autor ili administrator
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteEvent(int id)
        {
            var ev = await Context.Events.FindAsync(id);
            if (ev == null)
                return NotFound(T("EventNotFound", id));
            if (ev.CreatorId != User.GetUserId() && !User.IsAdmin())
                return Forbid(); // brise autor ili administrator

            // Veza Notifications -> Events je bez kaskade (vidi EventBoxContext), pa se brisu ovde
            Context.Notifications.RemoveRange(Context.Notifications.Where(n => n.EventId == id));

            Context.Events.Remove(ev);
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(ev.Image); // tek kad je dogadjaj stvarno obrisan
            return Ok(T("EventDeleted", id));
        }

        // PUT /api/events/{id}/image - postavlja ili menja sliku dogadjaja (multipart, polje "file").
        // Odgovor: { image } - ime novog fajla. Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        [RequestSizeLimit(FileService.MaxFileSize + 64 * 1024)] // + malo za zaglavlja multipart-a
        public async Task<ActionResult> UploadEventImage(int id, IFormFile? file)
        {
            var ev = await Context.Events.FindAsync(id);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId != User.GetUserId())
                return Forbid();

            var result = await _fileService.SaveImageAsync(file);
            if (result.Error != null)
                return BadRequest(new { message = result.Error });

            string? oldImage = ev.Image;
            ev.Image = result.FileName;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.DeleteImage(result.FileName); // upis nije uspeo - nova slika ne sme da ostane siroce
                throw;
            }
            _fileService.DeleteImage(oldImage);
            return Ok(new { image = ev.Image });
        }

        // DELETE /api/events/{id}/image - uklanja sliku dogadjaja. Referenca u bazi se brise i ako
        // fajla vise nema na disku.
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        public async Task<ActionResult> DeleteEventImage(int id)
        {
            var ev = await Context.Events.FindAsync(id);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId != User.GetUserId())
                return Forbid();
            string? oldImage = ev.Image;
            ev.Image = null;
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(oldImage);
            return Ok(T("ImageDeleted"));
        }
    }
}
