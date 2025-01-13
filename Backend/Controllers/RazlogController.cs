using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RazlogController : ControllerBase
    {
        public EventBoxContext Context { get; set; }

        public RazlogController(EventBoxContext context)
        {
            Context = context;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("KreirajRazlog/{dogadjaj_Id}/{razlog_prijave}/{opis}")]
        public async Task<ActionResult> KreirajRazlog(int dogadjaj_Id, string razlog_prijave, string opis) 
        {
            try
            {
                Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.Where(p => p.Dogadjaj_Id.Id == dogadjaj_Id).FirstAsync();
                Razlog r = new Razlog();
                r.Prijavljeni_dogadjaj_Id = pr_dog;
                r.Razlog_prijave = razlog_prijave;
                r.Opis = opis;

                Context.Razlozi.Add(r);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je dodat novi razlog");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno dodata nov razlog "+ex.Message);
            }
        }

        /*[HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiRazloge/{ID_razloga}")]
        public async Task<ActionResult> IzbrisiRazloge(int[] ID_razloga)
        {
            try
            {
                var razlozi = await Context.Razlozi.Where(p => ID_razloga.Contains(p.Id)).ToListAsync();
                razlozi.ForEach(elem =>
                {
                    Context.Razlozi.Remove(elem);
                });
                await Context.SaveChangesAsync();
                return Ok("Uspesno su obrisani razlozi dogadjaja");
            }
            catch(Exception ex)
            {
                return BadRequest("Nisu uspesno obrisani razlozi "+ex.Message);
            }
        }*/

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiRazlogeDogadjaja/{dogadjaj_ID}")]
        public async Task<ActionResult> IzbrisiRazlogeDogadjaja(int dogadjaj_ID)
        {
            try
            {
                Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.Where(p => p.Dogadjaj_Id.Id == dogadjaj_ID)
                                                                                 .Include(p => p.Razlozi).FirstOrDefaultAsync();

                if(pr_dog.Razlozi.Count() > 0)
                {
                    pr_dog.Razlozi.ForEach(p => {
                        Context.Razlozi.Remove(p);
                    });
                }
                await Context.SaveChangesAsync();
                return Ok("Uspesno su obrisani razlozi prijavljenog dogadjaja");
            }
            catch(Exception ex)
            {
                return BadRequest("Nisu uspesno obrisani razlozi prijavljenog dogadjaja "+ex.Message);
            }
        }
        
    }
}