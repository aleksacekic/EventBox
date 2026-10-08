using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class NotifikacijaController : ControllerBase
    {
        public EventBoxContext Context;
        public NotifikacijaController(EventBoxContext context)
        {
            this.Context = context;
        }

        // Notifikacije pravi server (Models/Obavestenja.cs) kad neko reaguje, komentarise ili
        // prijavi dogadjaj - klijent ih vise ne upisuje sam.

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiNotifikaciju/{id}")]
        public async Task<ActionResult> IzbrisiNotifikaciju(int id)
        {
            Notifikacija n = await Context.Notifikacije.FindAsync(id);
            if (n == null)
            {
                return NotFound("Notifikacija nije pronađena");
            }
            if (n.KorisnikCijaJeObjavaId != User.IdKorisnika())
                return Forbid();

            Context.Notifikacije.Remove(n);
            await Context.SaveChangesAsync();
            return Ok("Uspesno je izbrisana notifikacija sa ID-em: " + id);
        }

        // Videcemo kako ce da se vracaju notifikacije zbog protokola
    }
}
