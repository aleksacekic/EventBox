using Microsoft.AspNetCore.Authorization;
using EventBoxApi.Auth;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AdministratorController : ControllerBase
    {
        public EventBoxContext Context;
        public AdministratorController(EventBoxContext context)
        {
            this.Context = context;
        }

        // Pravila (provera je u telu metode, zato nema [Authorize] na akciji):
        //  - dok u bazi nema nijednog administratora, prvog moze da napravi bilo ko, ali SAMO
        //    sa lokalnog racunara (npr. iz Swagger-a na localhost) - resava "ko pravi prvog admina"
        //  - kad postoji bar jedan, nove administratore moze da dodaje samo prijavljen administrator
        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajAdministratora")]
        public async Task<ActionResult> DodajAdministratora([FromBody] AdministratorZahtev zahtev)
        {
            try
            {
                if (await Context.Administratori.AnyAsync())
                {
                    if (User.Identity?.IsAuthenticated != true)
                        return Unauthorized();
                    if (!User.JeAdmin())
                        return Forbid();
                }
                else if (!System.Net.IPAddress.IsLoopback(HttpContext.Connection.RemoteIpAddress ?? System.Net.IPAddress.None))
                {
                    return Forbid(); // prvog administratora moze da napravi samo lokalni zahtev
                }

                if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme)
                    || string.IsNullOrEmpty(zahtev.Lozinka) || zahtev.Lozinka.Length < 8)
                    return BadRequest("Korisnicko ime je obavezno, a lozinka mora imati najmanje 8 karaktera");

                zahtev.KorisnickoIme = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
                var greskaImena = KorisnickoIme.Proveri(zahtev.KorisnickoIme);
                if (greskaImena != null)
                    return BadRequest(greskaImena);
                if (await Context.Administratori.AnyAsync(p => p.Korisnicko_ime == zahtev.KorisnickoIme))
                    return Conflict("Administrator sa tim korisnickim imenom vec postoji");

                Administrator a = new Administrator();
                a.Ime = zahtev.Ime;
                a.Prezime = zahtev.Prezime;
                a.Email_adresa = zahtev.EmailAdresa;
                a.Korisnicko_ime = zahtev.KorisnickoIme;
                a.Lozinka = Lozinke.Hesiraj(zahtev.Lozinka);
                Context.Administratori.Add(a);
                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException e) when (KorisnickoIme.JeDuplikat(e))
                {
                    return Conflict("Administrator sa tim korisnickim imenom vec postoji");
                }
                return Ok("Uspesno ubacen administrator: " + zahtev.Ime + " " + zahtev.Prezime);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno ubacen administrator "+ ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("IzbrisiAdministratora/{id}")]
        public async Task<ActionResult> IzbrisiAdministratora(int id)
        {
            try
            {
            Administrator a = await Context.Administratori.FindAsync(id);

            Context.Administratori.Remove(a);
            await Context.SaveChangesAsync();
            return Ok("Uspesno ste izbrisali korisnika sa ID-em "+id);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisan administrator "+ex.Message);
            }
        }

        // Odjava administratora: brise mu token, pa stari odmah prestaje da vazi
        [HttpPost]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("Odjava")]
        public async Task<ActionResult> Odjava()
        {
            if (!int.TryParse(User.FindFirst("admin_id")?.Value, out int id))
                return Forbid();
            var a = await Context.Administratori.FindAsync(id);
            if (a == null)
                return Forbid();
            a.Token = null;
            a.Validnost = null;
            await Context.SaveChangesAsync();
            return Ok("Odjavljeni ste");
        }

        [HttpPost]
        [EnableCors("CORS")]
        [EnableRateLimiting(ZastitaPrijave.PolitikaPrijava)]
        [Route("LogovanjeAdministrator")]
        public async Task<ActionResult> LogovanjeAdministrator([FromBody] PrijavaZahtev zahtev, [FromServices] ZastitaPrijave zastita)
        {
            try
            {
                if (zahtev == null || string.IsNullOrEmpty(zahtev.KorisnickoIme) || string.IsNullOrEmpty(zahtev.Lozinka))
                    return Ok(new {nema="NEMA"});

                string ime = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
                if (zastita.Zakljucan("a", ime) is TimeSpan preostalo)
                {
                    Response.Headers.RetryAfter = ((int)Math.Ceiling(preostalo.TotalSeconds)).ToString();
                    return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ZastitaPrijave.Poruka(preostalo) });
                }

                Administrator a = await Context.Administratori.Where(p => p.Korisnicko_ime == ime).FirstOrDefaultAsync();
                if (a == null || !Lozinke.Proveri(a.Lozinka, zahtev.Lozinka, out bool ponovoHesirati))
                {
                    zastita.Neuspeh("a", ime);
                    return Ok(new {nema="NEMA"});
                }
                zastita.Uspeh("a", ime);

                if (ponovoHesirati)
                    a.Lozinka = Lozinke.Hesiraj(zahtev.Lozinka);

                // Sesija administratora (isto kao kod korisnika)
                a.Token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
                a.Validnost = DateTime.Now.AddMinutes(30);
                await Context.SaveChangesAsync();

                return Ok(new {token = a.Token, adminID = a.Id});
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje administratora "+ex.Message);
            }
        }
        
    }
}