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
    // Notifikacije ulogovanog korisnika. Pravi ih server (Models/NotificationService.cs) kad neko
    // reaguje, komentarise ili prijavi dogadjaj - klijent ih ne upisuje sam.
    [Authorize]
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        public EventBoxContext Context;
        private readonly IStringLocalizer<SharedResource> _t;
        public NotificationsController(EventBoxContext context, IStringLocalizer<SharedResource> t)
        {
            this.Context = context;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        // GET /api/notifications?limit=5 - najnovije prve (vidi NotificationDto)
        [HttpGet]
        [EnableCors("CORS")]
        public async Task<ActionResult> GetNotifications([FromQuery] int limit = 50)
        {
            int me = User.GetUserId();
            var notifications = await Context.Notifications
                .Where(n => n.RecipientId == me)
                .Where(n => n.Actor == null || !n.Actor.IsBlocked) // blokiranih se ne prikazuju
                .OrderByDescending(n => n.CreatedAt).ThenByDescending(n => n.Id)
                .Take(Math.Clamp(limit, 1, 100))
                .Select(NotificationDto.Projection)
                .ToListAsync();
            return Ok(notifications);
        }

        // DELETE /api/notifications/{id}
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            var notification = await Context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound(T("NotificationNotFound"));
            if (notification.RecipientId != User.GetUserId())
                return Forbid();

            Context.Notifications.Remove(notification);
            await Context.SaveChangesAsync();
            return Ok(T("NotificationDeleted", id));
        }
    }
}
