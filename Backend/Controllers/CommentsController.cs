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
    public class CommentDto
    {
        public int Id { get; set; }
        public string Text { get; set; }
        public int AuthorId { get; set; }
        public string AuthorUsername { get; set; }
        public string? AuthorImage { get; set; }
        public DateTime CreatedAt { get; set; } // UTC
        // Autor je blokiran: komentar vidi samo administrator (korisnicima se ne salje)
        public bool AuthorIsBlocked { get; set; }

        public static CommentDto From(Comment c) => new CommentDto
        {
            Id = c.Id, Text = c.Text, AuthorId = c.AuthorId,
            AuthorUsername = c.Author.Username, AuthorImage = c.Author.ProfileImage, CreatedAt = c.CreatedAt,
            AuthorIsBlocked = c.Author.IsBlocked
        };
    }

    public class CommentRequest
    {
        public string Text { get; set; }
    }

    // Komentari dogadjaja:
    //   GET/POST/DELETE /api/events/{eventId}/comments   (lista, novi, svi komentari dogadjaja)
    //   PUT/DELETE      /api/comments/{id}               (jedan komentar)
    [Authorize]
    [ApiController]
    [Route("api")]
    public class CommentsController : ControllerBase
    {
        public const int MaxTextLength = 1000;

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
        private string T(string key, params object[] args) => _t[key, args];

        // GET /api/events/{eventId}/comments - najnoviji prvi, stranicenje kursorom (Models/Pagination.cs):
        //   ?limit=10                 -> najnovijih 10 (+ total)
        //   ?limit=10&cursor=<kursor> -> sledecih 10 starijih
        // Odgovor: { items: [CommentDto], nextCursor, hasMore, total }
        [HttpGet]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> GetComments(int eventId, [FromQuery] int limit = 10, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));
            var query = Context.Comments.Include(c => c.Author).Where(c => c.EventId == eventId);
            if (!User.IsAdmin())
                query = query.Where(c => !c.Author.IsBlocked); // komentari blokiranih se ne prikazuju
            var page = await Pagination.GetPageAsync(query, after, limit);
            return Ok(new
            {
                items = page.Items.Select(CommentDto.From),
                page.NextCursor,
                page.HasMore,
                page.Total
            });
        }

        // POST /api/events/{eventId}/comments - komentar ulogovanog korisnika (tekst u telu zahteva)
        [HttpPost]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> CreateComment(int eventId, [FromBody] CommentRequest request)
        {
            if (User.IsAdmin())
                return Forbid(); // administrator nije korisnik i ne komentarise
            int authorId = User.GetUserId();
            // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
            string text = request?.Text?.Trim() ?? "";
            if (ValidateText(text) is string error)
                return BadRequest(error);

            var ev = await Context.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();
            var comment = new Comment
            {
                Text = text,
                AuthorId = authorId,
                CreatedAt = DateTime.UtcNow,
                EventId = ev.Id,
            };

            Context.Comments.Add(comment);
            await Context.SaveChangesAsync();

            await _notifications.NotifyOwnerAsync(ev, authorId, NotificationType.Comment, text, commentId: comment.Id);

            await Context.Entry(comment).Reference(c => c.Author).LoadAsync();
            return Ok(CommentDto.From(comment)); // klijent ga dodaje u listu bez ponovnog ucitavanja
        }

        // PUT /api/comments/{id} - izmena (samo autor)
        [HttpPut]
        [EnableCors("CORS")]
        [Route("comments/{id:int}")]
        public async Task<ActionResult> UpdateComment(int id, [FromBody] CommentRequest request)
        {
            string newText = request?.Text?.Trim() ?? "";
            if (ValidateText(newText) is string error)
                return BadRequest(error);

            var comment = await Context.Comments.FindAsync(id);
            if (comment == null)
                return NotFound();
            if (comment.AuthorId != User.GetUserId())
                return Forbid(); // menja samo autor
            comment.Text = newText;

            await Context.SaveChangesAsync();
            await _notifications.UpdateCommentNotificationAsync(comment);
            await Context.Entry(comment).Reference(c => c.Author).LoadAsync();
            return Ok(CommentDto.From(comment));
        }

        // DELETE /api/comments/{id} - brise autor ili administrator (moderacija)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("comments/{id:int}")]
        public async Task<ActionResult> DeleteComment(int id)
        {
            var comment = await Context.Comments.FindAsync(id);
            if (comment == null)
                return NotFound();
            if (comment.AuthorId != User.GetUserId() && !User.IsAdmin())
                return Forbid(); // brise autor ili administrator (moderacija)
            // Zajedno sa komentarom nestaje i notifikacija koju je napravio
            var removed = await _notifications.RemoveAsync(Context.Notifications.Where(n => n.CommentId == id));
            Context.Comments.Remove(comment);
            await Context.SaveChangesAsync();
            await _notifications.NotifyRemovedAsync(removed);
            return Ok(T("CommentDeleted", id));
        }

        // DELETE /api/events/{eventId}/comments - svi komentari dogadjaja (samo autor dogadjaja)
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("events/{eventId:int}/comments")]
        public async Task<ActionResult> DeleteEventComments(int eventId)
        {
            var ev = await Context.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId != User.GetUserId())
                return Forbid();

            // Notifikacije ovih komentara se brisu u istom SaveChanges (FK bez kaskade, vidi EventBoxContext)
            Context.Notifications.RemoveRange(Context.Notifications.Where(n => n.CommentId != null && n.EventId == eventId));
            Context.Comments.RemoveRange(Context.Comments.Where(c => c.EventId == eventId));
            await Context.SaveChangesAsync();
            return Ok(T("EventCommentsDeleted"));
        }

        private string? ValidateText(string text)
            => text.Length == 0 ? T("CommentEmpty")
             : text.Length > MaxTextLength ? T("CommentTooLong", MaxTextLength)
             : null;
    }
}
