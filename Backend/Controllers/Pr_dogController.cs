using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    public class PrijavaDogadjajaZahtev
    {
        public string Razlog { get; set; }
        public string? Opis { get; set; } // koristi se samo uz razlog "ostalo"
    }

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

        // Prijava je JEDAN zahtev (razlog u telu): u istoj transakciji se pravi/pronalazi prijava
        // dogadjaja, dodaje razlog sa prijavljivacem i preracunava brojac. Pre su bila dva zahteva
        // (PrijaviDogadjaj + KreirajRazlog), pa je pad izmedju njih ostavljao brojac bez razloga.
        [HttpPost]
        [EnableCors("CORS")]
        [Authorize]
        [Route("PrijaviDogadjaj/{dogadjaj_Id}")]
        public async Task<ActionResult> PrijaviDogadjaj(int dogadjaj_Id, [FromBody] PrijavaDogadjajaZahtev zahtev)
        {
            try
            {
                if (User.JeAdmin())
                    return Forbid(); // prijavljuju samo korisnici
                int prijavio = User.IdKorisnika();

                if (zahtev == null || !Razlog.Dozvoljeni.Contains(zahtev.Razlog))
                    return BadRequest("Nepoznat razlog prijave");
                string opis = zahtev.Razlog == "ostalo" ? (zahtev.Opis ?? "").Trim() : "";
                if (opis.Length > 500)
                    return BadRequest("Opis moze imati najvise 500 karaktera");

                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                if (d == null)
                    return NotFound();
                if (d.ID_Kreatora == prijavio)
                    return BadRequest("Ne moze se prijaviti sopstveni dogadjaj");

                if (await Context.Razlozi.AnyAsync(r => r.PrijavioId == prijavio && r.Prijavljeni_dogadjaj_Id.Dogadjaj_Id.Id == dogadjaj_Id))
                    return Conflict("Vec ste prijavili ovaj dogadjaj");

                using var transakcija = await Context.Database.BeginTransactionAsync();
                Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.FirstOrDefaultAsync(p => p.Dogadjaj_Id.Id == dogadjaj_Id);
                if (pr_dog == null)
                {
                    pr_dog = new Prijavljeni_dogadjaj { Dogadjaj_Id = d, Broj_prijava = 0 };
                    Context.Prijavljeni_dogadjaji.Add(pr_dog);
                }
                Context.Razlozi.Add(new Razlog
                {
                    Prijavljeni_dogadjaj_Id = pr_dog,
                    Razlog_prijave = zahtev.Razlog,
                    Opis = opis,
                    PrijavioId = prijavio
                });

                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Jedinstveni indeksi: isti korisnik ili drugi prvi prijavljivac u istom trenutku
                    return Conflict("Prijava je vec upisana, pokusajte ponovo");
                }
                // Brojac se racuna iz razloga jednim UPDATE-om (bez ++ koji gubi paralelne prijave)
                await Context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Prijavljeni_dogadjaj SET Broj_prijava = (SELECT COUNT(*) FROM Razlog WHERE Prijavljeni_dogadjaj_IdId = {pr_dog.Id}) WHERE Id = {pr_dog.Id}");
                await transakcija.CommitAsync();

                await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveEventReport", "Dogadjaj je prijavljen", dogadjaj_Id);
                return Ok("Dogadjaj je prijavljen");
            }
            catch(Exception ex)
            {
                return BadRequest("Dogadjaj nije uspesno prijavljen! "+ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
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
                    var pr_dogadjaji2 = await Context.Prijavljeni_dogadjaji.Include(p => p.Dogadjaj_Id).ThenInclude(d => d.KreatorId).Include(p => p.Razlozi).OrderBy(p => p.Id).Take(skok + pom).ToListAsync();
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
                    
                var pr_dogadjaji = await Context.Prijavljeni_dogadjaji.Include(p => p.Dogadjaj_Id).ThenInclude(d => d.KreatorId).Include(p => p.Razlozi).OrderBy(p => p.Id).Skip(pom).Take(skok).ToListAsync();
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
        [Authorize(Roles = "Admin")]
        [Route("IzbrisiPrijavljeniDogadjaj/{id}")]
        public async Task<ActionResult> IzbrisiPrijavljeniDogadjaj(int id)
        {
            try
            {
                Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.FindAsync(id);
                if (pr_dog == null)
                    return NotFound();
                // Razlozi se brisu kaskadno u bazi
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