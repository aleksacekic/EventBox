using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class NotifikacijaController : ControllerBase
    {
        public EventBoxContext Context;
        public NotifikacijaController(EventBoxContext context)
        {
            this.Context = context;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("PostaviNotifikaciju/{tipNotifikacije}/{sadrzaj}/{vreme}/{korisnik_Id}")]
        public async Task<ActionResult> PostaviNotifikaciju(string tipNotifikacije, string sadrzaj, DateTime vreme, int korisnik_Id)
        {
            try
            {
                Korisnik k = await Context.Korisnici.FindAsync(korisnik_Id);
                if (k == null)
                {
                    return NotFound("Korisnik nije pronađen");
                }

                Notifikacija n = new Notifikacija
                {
                    TipNotifikacije = tipNotifikacije,
                    Sadrzaj = sadrzaj,
                    Vreme = vreme,
                    Korisnik_Id = korisnik_Id
                };

                Context.Notifikacije.Add(n);
                await Context.SaveChangesAsync();
                return Ok("Uspesno ubacena nova notifikacija");
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno ubacena nova notifikacija: " + ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiNotifikaciju/{id}")]
        public async Task<ActionResult> IzbrisiNotifikaciju(int id)
        {
            try
            {
                Notifikacija n = await Context.Notifikacije.FindAsync(id);
                if (n == null)
                {
                    return NotFound("Notifikacija nije pronađena");
                }

                Context.Notifikacije.Remove(n);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je izbrisana notifikacija sa ID-em: " + id);
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana notifikacija: " + ex.Message);
            }
        }

        // Videcemo kako ce da se vracaju notifikacije zbog protokola
    }
}
