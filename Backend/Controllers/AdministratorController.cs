using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
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

        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajAdministratora/{ime}/{prezime}/{email_adresa}/{korisnicko_ime}/{lozinka}")]
        public async Task<ActionResult> DodajAdministratora(string ime, string prezime, string email_adresa, 
                                                            string korisnicko_ime, string lozinka)
        {
            try
            {
                Administrator a = new Administrator();
                a.Ime = ime;
                a.Prezime = prezime;
                a.Email_adresa = email_adresa;
                a.Korisnicko_ime = korisnicko_ime;
                a.Lozinka  = lozinka;
                Context.Administratori.Add(a);
                await Context.SaveChangesAsync();
                return Ok("Uspesno ubacen administrator: "+ime+" "+prezime);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno ubacen administrator "+ ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
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

        [HttpGet]
        [EnableCors("CORS")]
        [Route("LogovanjeAdministrator/{username}/{password}")]
        public async Task<ActionResult> LogovanjeAdministrator(string username, string password)
        {
            try
            {
                Administrator a  = await Context.Administratori.Where(p => p.Korisnicko_ime == username && p.Lozinka == password).FirstOrDefaultAsync();
                if(a == null)
                    return Ok(new {nema="NEMA"});
                return Ok(a);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje administratora "+ex.Message);
            }
        }
        
    }
}