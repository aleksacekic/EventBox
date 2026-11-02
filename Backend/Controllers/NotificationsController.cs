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
        private string T(string kljuc, params object[] args) => _t[kljuc, args];

        // GET /api/notifications?limit=5 - najnovije prve (vidi NotifikacijaDto)
        [HttpGet]
        [EnableCors("CORS")]
        public async Task<ActionResult> GetNotifications([FromQuery] int limit = 50)
        {
            int ja = User.GetUserId();
            var notifikacije = await Context.Notifikacije
                .Where(n => n.KorisnikCijaJeObjavaId == ja)
                .Where(n => n.KorisnikKojiReaguje == null || n.KorisnikKojiReaguje.Blokiran != -1)
                .OrderByDescending(n => n.Vreme).ThenByDescending(n => n.Id)
                .Take(Math.Clamp(limit, 1, 100))
                .Select(NotifikacijaDto.Projekcija)
                .ToListAsync();
            return Ok(notifikacije);
        }

        // DELETE /api/notifications/{id}
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}")]
        public async Task<ActionResult> DeleteNotification(int id)
        {
            Notifikacija n = await Context.Notifikacije.FindAsync(id);
            if (n == null)
            {
                return NotFound(T("NotificationNotFound"));
            }
            if (n.KorisnikCijaJeObjavaId != User.GetUserId())
                return Forbid();

            Context.Notifikacije.Remove(n);
            await Context.SaveChangesAsync();
            return Ok(T("NotificationDeleted", id));
        }
    }
}
