using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PorukaController : ControllerBase 
    {
        public EventBoxContext Context;
        public PorukaController(EventBoxContext context)
        {
            this.Context = context;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("KreirajPoruku/{chat_id}/{pisac_poruke}/{teskt}")]
        public async Task<ActionResult> KreirajPoruku(int chat_id, string pisac_poruke, string teskt)
        {
            try
            {
                Poruka p = new Poruka();
                Chat c = await Context.Chatovi.FindAsync(chat_id);
                p.Chat_Id = c;
                p.Pisac_Poruke = pisac_poruke;
                p.Tekst = teskt;
                Context.Poruke.Add(p);
                await Context.SaveChangesAsync();
                return Ok("Uspesno kreirana poruka");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno vracena poruka "+ex.Message);
            }
        }

        
    }
}