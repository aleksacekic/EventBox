using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
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
        private readonly Obavestenja _obavestenja;

        public Pr_dogController(EventBoxContext context, Obavestenja obavestenja)
        {
            Context = context;
            _obavestenja = obavestenja;
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

            // Vlasnik saznaje razlog, ali ne i ko je prijavio
            await _obavestenja.NotifikujVlasnikaAsync(d, null, TipNotifikacije.Prijava, zahtev.Razlog);
            return Ok("Dogadjaj je prijavljen");
        }

        // Lista prijavljenih dogadjaja za admina: najnovija prijava prva, stranicenje kursorom
        // (vidi DogadjajController). Uz svaku prijavu najvise 5 razloga.
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("VratiPrijavljene_dog")]
        public async Task<ActionResult> VratiPrijavljene_dog([FromQuery] int limit = 4, [FromQuery] string? cursor = null)
        {
            if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                return BadRequest("Neispravan kursor");

            var upit = Context.Prijavljeni_dogadjaji
                .Include(p => p.Dogadjaj_Id).ThenInclude(d => d.KreatorId)
                .Include(p => p.Razlozi);
            var strana = await Paginacija.UzmiAsync(upit, posle, limit);
            strana.Stavke.ForEach(p => p.Razlozi = p.Razlozi.Take(5).ToList());
            return Ok(strana);
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("IzbrisiPrijavljeniDogadjaj/{id}")]
        public async Task<ActionResult> IzbrisiPrijavljeniDogadjaj(int id)
        {
            Prijavljeni_dogadjaj pr_dog = await Context.Prijavljeni_dogadjaji.FindAsync(id);
            if (pr_dog == null)
                return NotFound();
            // Razlozi se brisu kaskadno u bazi
            Context.Prijavljeni_dogadjaji.Remove(pr_dog);
            await Context.SaveChangesAsync();
            return Ok("Uspesno je obrisan prijavljeni dogadjaj");
        }  
    }
}