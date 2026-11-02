using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;

namespace EventBoxApi.Controllers
{
    public class PrijavaDogadjajaZahtev
    {
        public string Razlog { get; set; }
        public string? Opis { get; set; } // koristi se samo uz razlog "ostalo"
    }

    // Prijave dogadjaja (moderacija):
    //   POST   /api/events/{eventId}/reports   (korisnik prijavljuje dogadjaj)
    //   GET    /api/reports                    (admin: lista prijavljenih dogadjaja)
    //   DELETE /api/reports/{id}               (admin: odbaci prijavu, dogadjaj ostaje)
    [ApiController]
    [Route("api")]
    public class ReportsController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        private readonly NotificationService _notifications;

        public ReportsController(EventBoxContext context, NotificationService notifications)
        {
            Context = context;
            _notifications = notifications;
        }

        // POST /api/events/{eventId}/reports  { "razlog": "...", "opis": "..." }
        // Prijava je JEDAN zahtev (razlog u telu): u istoj transakciji se pravi/pronalazi prijava
        // dogadjaja, dodaje razlog sa prijavljivacem i preracunava brojac. Pre su bila dva zahteva,
        // pa je pad izmedju njih ostavljao brojac bez razloga.
        [HttpPost]
        [EnableCors("CORS")]
        [Authorize]
        [Route("events/{eventId:int}/reports")]
        public async Task<ActionResult> ReportEvent(int eventId, [FromBody] PrijavaDogadjajaZahtev zahtev)
        {
            if (User.IsAdmin())
                return Forbid(); // prijavljuju samo korisnici
            int prijavio = User.GetUserId();

            if (zahtev == null || !Razlog.Dozvoljeni.Contains(zahtev.Razlog))
                return BadRequest("Nepoznat razlog prijave");
            string opis = zahtev.Razlog == "ostalo" ? (zahtev.Opis ?? "").Trim() : "";
            if (opis.Length > 500)
                return BadRequest("Opis moze imati najvise 500 karaktera");

            Dogadjaj d = await Context.Dogadjaji.FindAsync(eventId);
            if (d == null)
                return NotFound();
            if (d.ID_Kreatora == prijavio)
                return BadRequest("Ne moze se prijaviti sopstveni dogadjaj");

            if (await Context.Razlozi.AnyAsync(r => r.PrijavioId == prijavio && r.Prijavljeni_dogadjaj_Id.Dogadjaj_Id.Id == eventId))
                return Conflict("Vec ste prijavili ovaj dogadjaj");

            // Retry (EnableRetryOnFailure u Program.cs) ne radi sa rucnom transakcijom, pa cela
            // transakcija ide kroz execution strategy: ako baza privremeno nije dostupna, ponovi se ceo blok.
            Prijavljeni_dogadjaj? pr_dog = null;
            Razlog? razlog = null;
            bool vecPrijavljeno = false;
            var strategija = Context.Database.CreateExecutionStrategy();
            await strategija.ExecuteAsync(async () =>
            {
                // Ponovni pokusaj: odbaci ono sto je prethodni (neuspeli) pokusaj dodao u context
                if (razlog != null)
                    Context.Entry(razlog).State = EntityState.Detached;
                if (pr_dog != null && Context.Entry(pr_dog).State == EntityState.Added)
                    Context.Entry(pr_dog).State = EntityState.Detached;

                await using var transakcija = await Context.Database.BeginTransactionAsync();
                pr_dog = await Context.Prijavljeni_dogadjaji.FirstOrDefaultAsync(p => p.Dogadjaj_Id.Id == eventId);
                if (pr_dog == null)
                {
                    pr_dog = new Prijavljeni_dogadjaj { Dogadjaj_Id = d, Broj_prijava = 0 };
                    Context.Prijavljeni_dogadjaji.Add(pr_dog);
                }
                razlog = new Razlog
                {
                    Prijavljeni_dogadjaj_Id = pr_dog,
                    Razlog_prijave = zahtev.Razlog,
                    Opis = opis,
                    PrijavioId = prijavio
                };
                Context.Razlozi.Add(razlog);

                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException e) when (e.InnerException is SqlException { Number: 2601 or 2627 })
                {
                    // Jedinstveni indeksi: isti korisnik ili drugi prvi prijavljivac u istom trenutku.
                    // Samo greska duplikata - privremene greske baze idu dalje, na retry.
                    vecPrijavljeno = true;
                    return; // transakcija se ponistava pri izlasku (await using)
                }
                // Brojac se racuna iz razloga jednim UPDATE-om (bez ++ koji gubi paralelne prijave)
                await Context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Prijavljeni_dogadjaj SET Broj_prijava = (SELECT COUNT(*) FROM Razlog WHERE Prijavljeni_dogadjaj_IdId = {pr_dog.Id}) WHERE Id = {pr_dog.Id}");
                await transakcija.CommitAsync();
            });
            if (vecPrijavljeno)
                return Conflict("Prijava je vec upisana, pokusajte ponovo");

            // Vlasnik saznaje razlog, ali ne i ko je prijavio
            await _notifications.NotifyOwnerAsync(d, null, NotificationType.Report, zahtev.Razlog);
            return Ok("Dogadjaj je prijavljen");
        }

        // GET /api/reports - lista prijavljenih dogadjaja za admina: najnovija prijava prva,
        // stranicenje kursorom (vidi EventsController). Uz svaku prijavu najvise 5 razloga.
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("reports")]
        public async Task<ActionResult> GetReports([FromQuery] int limit = 4, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? posle))
                return BadRequest("Neispravan kursor");

            var upit = Context.Prijavljeni_dogadjaji
                .Include(p => p.Dogadjaj_Id).ThenInclude(d => d.KreatorId)
                .Include(p => p.Razlozi);
            var strana = await Pagination.GetPageAsync(upit, posle, limit);
            strana.Stavke.ForEach(p => p.Razlozi = p.Razlozi.Take(5).ToList());
            return Ok(strana);
        }

        // DELETE /api/reports/{id} - odbacuje prijavu (dogadjaj ostaje objavljen)
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("reports/{id:int}")]
        public async Task<ActionResult> DismissReport(int id)
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
