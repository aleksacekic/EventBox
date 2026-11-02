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
    // Komentar kako ga vidi klijent (ime i slika autora citaju se preko veze, uvek aktuelni)
    public class KomentarDto
    {
        public int Id { get; set; }
        public string Tekst { get; set; }
        public int AutorId { get; set; }
        public string Username_korisnika { get; set; }
        public string? SlikaKorisnika { get; set; }
        public DateTime Vreme { get; set; } // UTC
        // Autor je blokiran: komentar vidi samo administrator (korisnicima se ne salje)
        public bool AutorBlokiran { get; set; }

        public static KomentarDto From(Komentar k) => new KomentarDto
        {
            Id = k.Id, Tekst = k.Tekst, AutorId = k.AutorId,
            Username_korisnika = k.Autor.Korisnicko_Ime, SlikaKorisnika = k.Autor.KorisnikImage, Vreme = k.Vreme,
            AutorBlokiran = k.Autor.Blokiran == -1
        };
    }

    public class KomentarZahtev
    {
        public string Tekst { get; set; }
    }

    // Komentari dogadjaja:
    //   GET/POST/DELETE /api/events/{eventId}/comments   (lista, novi, svi komentari dogadjaja)
    //   PUT/DELETE      /api/comments/{id}               (jedan komentar)
    [Authorize]
    [ApiController]
    [Route("api")]
    public class CommentsController : ControllerBase
    {
        public EventBoxContext Context;
        private readonly NotificationService _notifications;
        private readonly IStringLocalizer<SharedResource> _t;
        public CommentsController(EventBoxContext context, NotificationService notifications, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            _notifications = notifications;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        // GET /api/events/{eventId}/comments - najnoviji prvi, stranicenje kursorom (Models/Pagination.cs):
        //   ?limit=10                 -> najnovijih 10 (+ ukupno)
        //   ?limit=10&cursor=<kursor> -> sledecih 10 starijih
        // Odgovor: { stavke: [KomentarDto], sledeciKursor, imaJos, ukupno }
        [HttpGet]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> GetComments(int eventId, [FromQuery] int limit = 10, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest(T("InvalidCursor"));
            var upit = Context.Komentari.Include(q => q.Autor).Where(q => q.Dogadjaj_Id.Id == eventId);
            if (!User.IsAdmin())
                upit = upit.Where(q => q.Autor.Blokiran != -1); // komentari blokiranih se ne prikazuju
            var strana = await Pagination.GetPageAsync(upit, posle, limit);
            return Ok(new
            {
                stavke = strana.Stavke.Select(KomentarDto.From),
                strana.SledeciKursor,
                strana.ImaJos,
                strana.Ukupno
            });
        }

        // POST /api/events/{eventId}/comments - komentar ulogovanog korisnika (tekst u telu zahteva)
        [HttpPost]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> CreateComment(int eventId, [FromBody] KomentarZahtev zahtev)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i ne komentarise
            int autorId = User.GetUserId();
            // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
            string tekst = zahtev?.Tekst?.Trim() ?? "";
            if (ValidateText(tekst) is string greska)
                return BadRequest(greska);

            Dogadjaj d = await Context.Dogadjaji.FindAsync(eventId);
            if(d == null)
                return NotFound();
            Komentar k = new Komentar();
            k.Tekst = tekst;
            k.AutorId = autorId;
            k.Vreme = DateTime.UtcNow;
            k.Dogadjaj_Id = d;

            Context.Komentari.Add(k);
            await Context.SaveChangesAsync();

            await _notifications.NotifyOwnerAsync(d, autorId, NotificationType.Comment, tekst, komentarId: k.Id);

            await Context.Entry(k).Reference(x => x.Autor).LoadAsync();
            return Ok(KomentarDto.From(k)); // klijent ga dodaje u listu bez ponovnog ucitavanja
        }

        // PUT /api/comments/{id} - izmena (samo autor)
        [HttpPut]
        [EnableCors("CORS")]
        [Route("comments/{id:int}")]
        public async Task<ActionResult> UpdateComment(int id, [FromBody] KomentarZahtev zahtev)
        {
            string novTekst = zahtev?.Tekst?.Trim() ?? "";
            if (ValidateText(novTekst) is string greska)
                return BadRequest(greska);

            Komentar k = await Context.Komentari.FindAsync(id);
            if(k == null)
                return NotFound();
            if(k.AutorId != User.GetUserId())
                return Forbid(); // menja samo autor
            k.Tekst = novTekst;

            Context.Komentari.Update(k);
            await Context.SaveChangesAsync();
            await _notifications.UpdateCommentNotificationAsync(k);
            await Context.Entry(k).Reference(x => x.Autor).LoadAsync();
            return Ok(KomentarDto.From(k));
        }

        // DELETE /api/comments/{id} - brise autor ili administrator (moderacija)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("comments/{id:int}")]
        public async Task<ActionResult> DeleteComment(int id)
        {
            Komentar k = await Context.Komentari.FindAsync(id);
            if(k == null)
                return NotFound();
            if(k.AutorId != User.GetUserId() && !User.IsAdmin())
                return Forbid(); // brise autor ili administrator (moderacija)
            // Zajedno sa komentarom nestaje i notifikacija koju je napravio
            var uklonjene = await _notifications.RemoveAsync(Context.Notifikacije.Where(n => n.KomentarId == id));
            Context.Komentari.Remove(k);
            await Context.SaveChangesAsync();
            await _notifications.NotifyRemovedAsync(uklonjene);
            return Ok(T("CommentDeleted", id));
        }

        // DELETE /api/events/{eventId}/comments - svi komentari dogadjaja (samo vlasnik dogadjaja)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> DeleteEventComments(int eventId)
        {
            Dogadjaj d = await Context.Dogadjaji.Where(p => p.Id == eventId).Include(p => p.Lista_Komentara).FirstOrDefaultAsync();
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.GetUserId())
                return Forbid();

            // Notifikacije ovih komentara se brisu u istom SaveChanges (FK bez kaskade, vidi EventBoxContext)
            Context.Notifikacije.RemoveRange(Context.Notifikacije.Where(n => n.KomentarId != null && n.DogadjajId == eventId));
            Context.Komentari.RemoveRange(d.Lista_Komentara);
            await Context.SaveChangesAsync();
            return Ok(T("EventCommentsDeleted"));
        }

        private string? ValidateText(string tekst)
            => tekst.Length == 0 ? T("CommentEmpty")
             : tekst.Length > 1000 ? T("CommentTooLong", 1000)
             : null;
    }
}
