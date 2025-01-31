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
    public class Pr_dogController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        private readonly IHubContext<NotificationHub> _hubContext;

        public Pr_dogController(EventBoxContext context, IHubContext<NotificationHub> hubContext)
        {
            Context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("PrijaviDogadjaj/{dogadjaj_Id}")]
        public async Task<ActionResult> PrijaviDogadjaj(int dogadjaj_Id)
        {
            try
            {
            await Validnost.Validiraj(Context, Request);
                    Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                    Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.Where(p => p.Dogadjaj_Id == d).FirstOrDefaultAsync();
                    if (pr_dog == null)
            {
                pr_dog = new Prijavljeni_dogadjaj
                {
                    Dogadjaj_Id = d,
                    Broj_prijava = 1
                };
                Context.Prijavljeni_dogadjaji.Add(pr_dog);
                await Context.SaveChangesAsync();
            }
            else
            {
                pr_dog.Broj_prijava++;
                Context.Prijavljeni_dogadjaji.Update(pr_dog);
                await Context.SaveChangesAsync();
            }

                //OVDE MOZE DA BUDE PROBLEM! Proveri!
                //int korisnik_Id = int.Parse(Request.Headers["UserID"]);
                //Console.WriteLine(korisnik_Id);
                // Slanje notifikacije kreatoru događaja
                //if (d.ID_Kreatora != korisnik_Id)  // Ne šaljemo notifikaciju korisniku koji je prijavio događaj
                //{
                    await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveEventReport", "Dogadjaj je prijavljen", dogadjaj_Id);
               //}
                return Ok("Dogadjaj je vec prijavljen tako je sada azuriran");
            }
            catch(Exception ex)
            {
                return BadRequest("Dogadjaj nije uspesno prijavljen! "+ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiPrijavljene_dog/{broj_posiljke}/{ukupno_elemenata}")]
        public async Task<ActionResult> VratiPrijavljene_dog(int broj_posiljke, int ukupno_elemenata) //VRATICE SE FIKSAN BROJ RAZLOGA
        {
            try
            {
                int skok = 4; 
                int ukupno = ukupno_elemenata;

                if(ukupno == 0)
                    ukupno = Context.Prijavljeni_dogadjaji.Count();

                int pom = ukupno - broj_posiljke * skok;

                if(pom <= skok * (-1))
                    return Ok(new {kraj="KRAJ"});

                if(pom < 0 && pom > skok * (-1))
                {
                    var pr_dogadjaji2 = await Context.Prijavljeni_dogadjaji.Include(p => p.Dogadjaj_Id).Include(p => p.Razlozi).Take(skok + pom).ToListAsync();
                    pr_dogadjaji2.ForEach(p => {
                        if(p.Razlozi.Count() > 5)
                            p.Razlozi = p.Razlozi.Take(5).ToList();
                    });
                    var odgovor2 = new {
                        Ukupno_elemenata = ukupno,
                        Broj_posiljke = broj_posiljke,
                        Dogadjaji = pr_dogadjaji2
                    };

                return Ok(odgovor2);
                }
                    
                var pr_dogadjaji = await Context.Prijavljeni_dogadjaji.Include(p => p.Dogadjaj_Id).Include(p => p.Razlozi).Skip(pom).Take(skok).ToListAsync();
                pr_dogadjaji.ForEach(p => {
                        if(p.Razlozi.Count() > 5)
                            p.Razlozi = p.Razlozi.Take(5).ToList();
                    });

                var odgovor = new {
                    Ukupno_elemenata = ukupno,
                    Broj_posiljke = broj_posiljke,
                    Dogadjaji = pr_dogadjaji
                };

                return Ok(odgovor);
            }
            catch(Exception ex)
            {
                return BadRequest($"Nije uspelo vracanje posiljke: {broj_posiljke}, ukupno elementa: {ukupno_elemenata} "+ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiPrijavljeniDogadjaj/{id}")]
        public async Task<ActionResult> IzbrisiPrijavljeniDogadjaj(int id)
        {
            try
            {
                Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.FindAsync(id);
                Context.Prijavljeni_dogadjaji.Remove(pr_dog);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je obrisan prijavljeni dogadjaj");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno obrisan prijavljeni dogadjaj "+ex.Message);
            }
        }  
    }
}