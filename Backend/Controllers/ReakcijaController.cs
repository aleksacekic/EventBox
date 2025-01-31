using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ReakcijaController : ControllerBase 
    {
        public EventBoxContext Context;

        private readonly IHubContext<NotificationHub> _hubContext;
        public ReakcijaController(EventBoxContext context, IHubContext<NotificationHub> hubContext)
        {
            this.Context = context;
             _hubContext = hubContext;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("PostaviReakciju/{tip}/{korisnik_Id}/{dogadjaj_Id}")]
        public async Task<ActionResult> PostaviReakicju(string tip, int korisnik_Id, int dogadjaj_Id)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                if(tip == "Mozda")
                    d.Broj_Mozda++;
                if(tip == "Zainteresovan")
                    d.Broj_Zainteresovanih++;
                if(tip == "Nezainteresovan")
                    d.Broj_Nezainteresovanih++;

                Reakcija r = new Reakcija();
                r.Tip = tip;
                r.Korisnik_ID = korisnik_Id;
                r.Dogadjaj_ID = d;
                //Console.WriteLine("SACEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE");
                //Console.WriteLine(d.ID_Kreatora);
                Context.Reakcije.Add(r);
                Context.Dogadjaji.Update(d);
                await Context.SaveChangesAsync();


                await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveNewReaction", tip, dogadjaj_Id);
                //await _hubContext.Clients.All.SendAsync("ReceiveNewReaction", tip, dogadjaj_Id);


                
                return Ok("Uspesno je dodata rekcija");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno dodata reakcija "+ex.Message);
            }
        }

        [HttpPut]
        [EnableCors("CORS")]
        [Route("PromeniReakciju/{tip_prethodni}/{tip_trenutni}/{korisnik_id}/{dogadjaj_id}")]
        public async Task<ActionResult> PromeniReakciju(string tip_prethodni, string tip_trenutni, int korisnik_id, int dogadjaj_id)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.Include(p => p.Lista_Reakcija).FirstAsync(p => p.Id == dogadjaj_id);
                if(tip_trenutni == "Mozda")
                    d.Broj_Mozda++;
                if(tip_trenutni == "Zainteresovan")
                    d.Broj_Zainteresovanih++;
                if(tip_trenutni == "Nezainteresovan")
                    d.Broj_Nezainteresovanih++;
                if(tip_prethodni == "Mozda")
                    d.Broj_Mozda--;
                if(tip_prethodni == "Zainteresovan")
                    d.Broj_Zainteresovanih--;
                if(tip_prethodni == "Nezainteresovan")
                    d.Broj_Nezainteresovanih--;

                Reakcija r = d.Lista_Reakcija.FirstOrDefault(p => p.Korisnik_ID == korisnik_id);
                r.Tip = tip_trenutni;
                Context.Reakcije.Update(r);
                Context.Dogadjaji.Update(d);
                await Context.SaveChangesAsync();
                //if(d.ID_Kreatora != korisnik_id)
                //{
                    await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveNewReaction", tip_trenutni, dogadjaj_id);
                //}
                return Ok($"Uspesno je promenjena reakcija korisnika sa ID-em: {korisnik_id} na dogadjaj: {d.Naslov}");
                         
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno azurirana reakcija "+ex.Message);
            }                     
        }
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiReakciju/{tip}/{korisnik_id}/{dogadjaj_id}")]
        public async Task<ActionResult> IzbrisiReakciju(string tip, int korisnik_id, int dogadjaj_id)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.Include(p => p.Lista_Reakcija).FirstAsync(p => p.Id == dogadjaj_id);
                if(tip == "Mozda")
                    d.Broj_Mozda--;
                if(tip == "Zainteresovan")
                    d.Broj_Zainteresovanih--;
                if(tip == "Nezainteresovan")
                    d.Broj_Nezainteresovanih--;
                
                Reakcija r = d.Lista_Reakcija.FirstOrDefault(p => p.Korisnik_ID == korisnik_id);
                Context.Dogadjaji.Update(d);
                Context.Reakcije.Remove(r);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je obrisana reakcija");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana reakcija " + ex.Message);
            }
        }
        
        //PRETHODNA VERZIJA FUNKCIJE VRATI_REAKCIJE
        /*[HttpPost] //Alternativa: POST
        [EnableCors("CORS")]
        [Route("VratiReakcije/{id_korisnika}")] 
        public async Task<ActionResult> VratiReakcije([FromForm] int[] ID_dogadjaja, int id_korisnika)
        {
            try
            {
                List<Object> reakcije = new List<Object>();
                Dogadjaj d = new Dogadjaj();
                List<int> lista = ID_dogadjaja.ToList();
                lista.ForEach(p => {
                    d = Context.Dogadjaji.Where(q => q.Id == p).Include(q => q.Lista_Reakcija).FirstOrDefault();
                    if(d.Lista_Reakcija.Count() > 0)
                    {
                        Reakcija reakcija = d.Lista_Reakcija.Where(q => q.Korisnik_ID == id_korisnika).FirstOrDefault();
                        if(reakcija != null)
                            reakcije.Add(new {dogadjaj_ID = d.Id, reakcija_ID = reakcija.Id,tip = reakcija.Tip});
                    }
                });
                await Context.SaveChangesAsync();
                return Ok(reakcije);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno vracanje reakcija! "+ex.Message);
            }
        }*/

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiReakcijeDogadjaja/{dogadjaj_ID}")]
        public async Task<ActionResult> IzbrisiReakcijeDogadjaja(int dogadjaj_ID)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.Where(p => p.Id == dogadjaj_ID).Include(p => p.Lista_Reakcija).FirstOrDefaultAsync();

                if(d.Lista_Reakcija.Count() > 0)
                {
                    d.Lista_Reakcija.ForEach(p => {
                        Context.Reakcije.Remove(p);
                    });
                }
                await Context.SaveChangesAsync();
                return Ok("Uspesno su obrisane reakije dogadjaja");
            }
            catch(Exception ex)
            {
                return BadRequest("Nisu uspesno obrisane reakcije dogadjaja "+ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiReakcije/{id_korisnika}/{ID_dogadjaja}")]
        public async Task<ActionResult> VratiReakcije(int id_korisnika, string ID_dogadjaja)
        {
                try
                {
                    List<Object> reakcije = new List<Object>();
                    Dogadjaj d = new Dogadjaj();
                    List<int> lista = ID_dogadjaja.Split(',').Select(int.Parse).ToList();
                    lista.ForEach(p =>
                    {
                        d = Context.Dogadjaji.Where(q => q.Id == p).Include(q => q.Lista_Reakcija).FirstOrDefault();
                        if (d.Lista_Reakcija.Count() > 0)
                        {
                            Reakcija reakcija = d.Lista_Reakcija.Where(q => q.Korisnik_ID == id_korisnika).FirstOrDefault();
                            if (reakcija != null)
                            reakcije.Add(new { dogadjaj_ID = d.Id, reakcija_ID = reakcija.Id, tip = reakcija.Tip });
                        }
                    });
                    await Context.SaveChangesAsync();
                    return Ok(reakcije);
                }
                catch (Exception ex)
                {
                    return BadRequest("Nije uspešno vraćanje reakcija! " + ex.Message);
                }
        }
    }
}