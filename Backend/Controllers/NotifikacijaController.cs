using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    public class NotifikacijaZahtev
    {
        public string TipReakcije { get; set; }
        public string SadrzajReakcije { get; set; }
        public string Vreme { get; set; }
    }

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

        //[HttpPost]
        [EnableCors("CORS")]
        [HttpPost("PostaviNotifikaciju/{dogadjaj_Id}/{korisnik_reaguje_Id}/{korisnik_Id}")]
        public async Task<ActionResult> PostaviNotifikaciju(int dogadjaj_Id, int korisnik_reaguje_Id, int korisnik_Id, [FromBody] NotifikacijaZahtev zahtev)
        {
            try
            {
                if (korisnik_Id != User.IdKorisnika())
                    return Forbid(); // notifikaciju za svoju objavu snima njen vlasnik
                var dogadjajNotif = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                if (dogadjajNotif == null || dogadjajNotif.ID_Kreatora != korisnik_Id)
                    return Forbid();

                // Tekst (npr. komentar) ide u telu zahteva - u URL-u bi / ? # kvarili rutu
                string tip_reakcije = zahtev.TipReakcije;
                string sadrzaj_reakcije = zahtev.SadrzajReakcije;
                DateTime vreme = DateTime.TryParse(zahtev.Vreme, out var parsirano) ? parsirano : DateTime.Now;

                Korisnik k = await Context.Korisnici.FindAsync(korisnik_Id);
                if (k == null)
                {
                    return NotFound("Korisnik nije pronađen");
                }
               
                Notifikacija n = new Notifikacija
                {
                    DogadjajId = dogadjaj_Id,
                    KorisnikKojiReagujeId = korisnik_reaguje_Id,
                    TipReakcije = tip_reakcije,
                    SadrzajReakcije = sadrzaj_reakcije,
                    Vreme = vreme,
                    KorisnikCijaJeObjavaId = korisnik_Id,
                    Korisnik = k
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
                if (n.KorisnikCijaJeObjavaId != User.IdKorisnika())
                    return Forbid();

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
