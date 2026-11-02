using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;

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
        public EventsController(EventBoxContext context, IFileService fs)
        {
            this.Context = context;
            this._fileService = fs;
        }

        // Liste dogadjaja: najnoviji prvi, stranicenje kursorom (Models/Pagination.cs).
        //   ?limit=3                -> prva strana
        //   ?limit=3&cursor=<kursor> -> sledeca (kursor = sledeciKursor iz prethodnog odgovora)
        // Odgovor: { stavke, sledeciKursor, imaJos, ukupno }  (ukupno samo uz prvu stranu)
        // Sadrzaj blokiranih korisnika se ne prikazuje (ne brise se - posle odblokiranja je opet tu).
        // Administrator vidi sve.
        private IQueryable<Dogadjaj> OnlyVisible(IQueryable<Dogadjaj> upit)
            => User.IsAdmin() ? upit : upit.Where(d => d.KreatorId.Blokiran != -1);

        private async Task<ActionResult> GetEventPage(IQueryable<Dogadjaj> upit, int limit, string? cursor)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest("Neispravan kursor");
            return Ok(await Pagination.GetPageAsync(upit.Include(d => d.KreatorId), posle, limit));
        }

        // GET /api/events - feed: predstojeci dogadjaji
        [HttpGet]
        [EnableCors("CORS")]
        public Task<ActionResult> GetUpcomingEvents([FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            DateTime danas = DateTime.Today;
            return GetEventPage(OnlyVisible(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas)), limit, cursor);
        }

        // GET /api/events/by-date?date=2026-11-02 - dogadjaji tog dana
        [HttpGet]
        [EnableCors("CORS")]
        [Route("by-date")]
        public Task<ActionResult> GetEventsByDate([FromQuery] DateTime date, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            DateTime od = date.Date;
            DateTime do_ = od.AddDays(1);
            return GetEventPage(OnlyVisible(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= od && d.Datum_Dogadjaja < do_)), limit, cursor);
        }

        // GET /api/events/search?title=koncert - predstojeci dogadjaji ciji naziv sadrzi tekst
        [HttpGet]
        [EnableCors("CORS")]
        [Route("search")]
        public async Task<ActionResult> SearchEvents([FromQuery] string title, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            if (string.IsNullOrWhiteSpace(title))
                return BadRequest("Naziv je obavezan");
            DateTime danas = DateTime.Today;
            return await GetEventPage(OnlyVisible(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas && d.Naslov.Contains(title))), limit, cursor);
        }

        // GET /api/events/all?title= - admin: SVI dogadjaji, i oni koji su prosli (feed korisnika
        // prikazuje samo predstojece), najnoviji prvi. ?title= opciono suzava po nazivu.
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("all")]
        public Task<ActionResult> GetAllEvents([FromQuery] string? title, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            IQueryable<Dogadjaj> upit = Context.Dogadjaji;
            if (!string.IsNullOrWhiteSpace(title))
            {
                string trazi = title.Trim();
                upit = upit.Where(d => d.Naslov.Contains(trazi));
            }
            return GetEventPage(upit, limit, cursor);
        }

        // GET /api/events/{id}
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> GetEvent(int id)
        {
            var dogadjaj = await Context.Dogadjaji.Include(d => d.KreatorId).FirstOrDefaultAsync(d => d.Id == id);
            // Dogadjaj blokiranog korisnika je sakriven (kao da ne postoji) za sve osim administratora
            if (dogadjaj == null || (dogadjaj.KreatorBlokiran && !User.IsAdmin()))
            {
                return NotFound($"Događaj sa ID-em {id} nije pronađen.");
            }

            return Ok(dogadjaj);
        }

        // POST /api/events - novi dogadjaj ulogovanog korisnika. Podaci idu u telu (DogadjajZahtev);
        // kreator i datum objave postavlja server. Neispravan unos -> 400 { message, greske: { polje: poruka } }.
        [HttpPost]
        [EnableCors("CORS")]
        public async Task<ActionResult> CreateEvent([FromBody] DogadjajZahtev zahtev)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i nema dogadjaje
            if (zahtev == null)
                return BadRequest("Nedostaju podaci o dogadjaju");
            var greske = zahtev.Validate();
            if (greske.Count > 0)
                return BadRequest(new { message = "Proverite unete podatke.", greske });

            var dog = new Dogadjaj
            {
                ID_Kreatora = User.GetUserId(),
                Datum_Objave = DateTime.Today,
                DogadjajImage = null,
            };
            zahtev.ApplyTo(dog);
            Context.Dogadjaji.Add(dog);
            await Context.SaveChangesAsync();

            // isti oblik kao u listama (sa imenom i slikom kreatora), da kartica odmah ima sve
            await Context.Entry(dog).Reference(d => d.KreatorId).LoadAsync();
            return Ok(dog);
        }

        // PUT /api/events/{id} - izmena dogadjaja (samo kreator), isto telo i ista pravila kao pri
        // pravljenju. Datum vec odrzanog dogadjaja moze ostati isti, iako je u proslosti.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> UpdateEvent(int id, [FromBody] DogadjajZahtev zahtev)
        {
            Dogadjaj dog = await Context.Dogadjaji.Include(d => d.KreatorId).FirstOrDefaultAsync(d => d.Id == id);
            if(dog == null)
                return NotFound();
            if(dog.ID_Kreatora != User.GetUserId())
                return Forbid();
            if (zahtev == null)
                return BadRequest("Nedostaju podaci o dogadjaju");
            var greske = zahtev.Validate(allowedPastDate: dog.Datum_Dogadjaja);
            if (greske.Count > 0)
                return BadRequest(new { message = "Proverite unete podatke.", greske });

            zahtev.ApplyTo(dog);
            await Context.SaveChangesAsync();
            return Ok(dog);
        }

        // DELETE /api/events/{id} - brise vlasnik ili administrator
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteEvent(int id)
        {
            var dog = await Context.Dogadjaji.FindAsync(id);
            if(dog == null)
                return NotFound($"Dogadjaj sa ID-em {id} nije pronadjen");
            if(dog.ID_Kreatora != User.GetUserId() && !User.IsAdmin())
                return Forbid(); // brise vlasnik ili administrator

            // Notifikacija cuva samo DogadjajId (bez FK), baza je ne brise sama
            var notifikacije = Context.Notifikacije.Where(n => n.DogadjajId == id);
            Context.Notifikacije.RemoveRange(notifikacije);

            Context.Dogadjaji.Remove(dog);
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(dog.DogadjajImage); // tek kad je dogadjaj stvarno obrisan
            return Ok($"Uspesno je izbrisan dogadjaj sa ID-em {id}");
        }

        // PUT /api/events/{id}/image - postavlja ili menja sliku dogadjaja (multipart, polje "fajl").
        // Odgovor: { slika } - ime novog fajla. Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        [RequestSizeLimit(FileService.MaxFileSize + 64 * 1024)] // + malo za zaglavlja multipart-a
        public async Task<ActionResult> UploadEventImage(int id, IFormFile? fajl)
        {
            Dogadjaj? d = await Context.Dogadjaji.FindAsync(id);
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.GetUserId())
                return Forbid();

            var rezultat = await _fileService.SaveImageAsync(fajl);
            if (rezultat.Error != null)
                return BadRequest(new { message = rezultat.Error });

            string? stara = d.DogadjajImage;
            d.DogadjajImage = rezultat.FileName;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.DeleteImage(rezultat.FileName); // upis nije uspeo - nova slika ne sme da ostane siroce
                throw;
            }
            _fileService.DeleteImage(stara);
            return Ok(new { slika = d.DogadjajImage });
        }

        // DELETE /api/events/{id}/image - uklanja sliku dogadjaja. Referenca u bazi se brise i ako
        // fajla vise nema na disku.
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        public async Task<ActionResult> DeleteEventImage(int id)
        {
            Dogadjaj? d = await Context.Dogadjaji.FindAsync(id);
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.GetUserId())
                return Forbid();
            string? stara = d.DogadjajImage;
            d.DogadjajImage = null;
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(stara);
            return Ok("Uspesno izbrisana slika");
        }
    }
}
