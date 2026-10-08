using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class ReakcijaController : ControllerBase
    {
        public EventBoxContext Context;

        private readonly Obavestenja _obavestenja;
        public ReakcijaController(EventBoxContext context, Obavestenja obavestenja)
        {
            this.Context = context;
            _obavestenja = obavestenja;
        }

        // Postavlja reakciju korisnika na dogadjaj. Ako korisnik vec ima reakciju na tom
        // dogadjaju, samo joj menja tip (nikad dve reakcije istog korisnika na jednom dogadjaju).
        [HttpPost]
        [EnableCors("CORS")]
        [Route("PostaviReakciju/{tip}/{korisnik_Id}/{dogadjaj_Id}")]
        public async Task<ActionResult> PostaviReakicju(string tip, int korisnik_Id, int dogadjaj_Id)
        {
            try
            {
                if (!Reakcija.Tipovi.Contains(tip))
                    return BadRequest("Nepoznat tip reakcije: " + tip);
                if (korisnik_Id != User.IdKorisnika())
                    return Forbid(); // reaguje samo u svoje ime
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                if (d == null)
                    return NotFound();

                Reakcija r = await Context.Reakcije
                    .FirstOrDefaultAsync(p => p.Korisnik_ID == korisnik_Id && p.Dogadjaj_ID.Id == dogadjaj_Id);
                if (r == null)
                {
                    r = new Reakcija();
                    r.Korisnik_ID = korisnik_Id;
                    r.Dogadjaj_ID = d;
                    Context.Reakcije.Add(r);
                }
                r.Tip = tip;

                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Dva istovremena zahteva istog korisnika: drugi udara u jedinstven indeks
                    return Conflict("Reakcija je vec postavljena");
                }
                await BrojaciReakcija.OsveziAsync(Context, dogadjaj_Id);

                await _obavestenja.NotifikujVlasnikaAsync(d, korisnik_Id, TipNotifikacije.Reakcija, tip, reakcijaId: r.Id);

                return Ok("Uspesno je dodata rekcija");
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno dodata reakcija " + ex.Message);
            }
        }

        // tip_prethodni ostaje u ruti zbog kompatibilnosti, ali se ne koristi: prethodni tip
        // se cita iz baze, a brojaci se racunaju iz reakcija
        [HttpPut]
        [EnableCors("CORS")]
        [Route("PromeniReakciju/{tip_prethodni}/{tip_trenutni}/{korisnik_id}/{dogadjaj_id}")]
        public async Task<ActionResult> PromeniReakciju(string tip_prethodni, string tip_trenutni, int korisnik_id, int dogadjaj_id)
        {
            try
            {
                if (!Reakcija.Tipovi.Contains(tip_trenutni))
                    return BadRequest("Nepoznat tip reakcije: " + tip_trenutni);
                if (korisnik_id != User.IdKorisnika())
                    return Forbid();
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_id);
                if (d == null)
                    return NotFound();
                Reakcija r = await Context.Reakcije
                    .FirstOrDefaultAsync(p => p.Korisnik_ID == korisnik_id && p.Dogadjaj_ID.Id == dogadjaj_id);
                if (r == null)
                    return NotFound("Korisnik nema reakciju na ovaj dogadjaj");

                r.Tip = tip_trenutni;
                await Context.SaveChangesAsync();
                await BrojaciReakcija.OsveziAsync(Context, dogadjaj_id);

                await _obavestenja.NotifikujVlasnikaAsync(d, korisnik_id, TipNotifikacije.Reakcija, tip_trenutni, reakcijaId: r.Id);
                return Ok($"Uspesno je promenjena reakcija korisnika sa ID-em: {korisnik_id} na dogadjaj: {d.Naslov}");

            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno azurirana reakcija " + ex.Message);
            }
        }

        // tip ostaje u ruti zbog kompatibilnosti; brise se reakcija korisnika, kog god tipa bila
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiReakciju/{tip}/{korisnik_id}/{dogadjaj_id}")]
        public async Task<ActionResult> IzbrisiReakciju(string tip, int korisnik_id, int dogadjaj_id)
        {
            try
            {
                if (korisnik_id != User.IdKorisnika())
                    return Forbid();
                Reakcija r = await Context.Reakcije
                    .FirstOrDefaultAsync(p => p.Korisnik_ID == korisnik_id && p.Dogadjaj_ID.Id == dogadjaj_id);
                if (r == null)
                    return NotFound();
                // Povucena reakcija povlaci i svoju notifikaciju
                var uklonjene = await _obavestenja.UkloniAsync(Context.Notifikacije.Where(n => n.ReakcijaId == r.Id));
                Context.Reakcije.Remove(r);
                await Context.SaveChangesAsync();
                await BrojaciReakcija.OsveziAsync(Context, dogadjaj_id);
                await _obavestenja.JaviUklonjeneAsync(uklonjene);
                return Ok("Uspesno je obrisana reakcija");
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana reakcija " + ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiReakcijeDogadjaja/{dogadjaj_ID}")]
        public async Task<ActionResult> IzbrisiReakcijeDogadjaja(int dogadjaj_ID)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_ID);
                if (d == null)
                    return NotFound();
                if (d.ID_Kreatora != User.IdKorisnika())
                    return Forbid();

                await Context.Notifikacije.Where(n => n.ReakcijaId != null && n.DogadjajId == dogadjaj_ID).ExecuteDeleteAsync();
                await Context.Reakcije.Where(r => r.Dogadjaj_ID.Id == dogadjaj_ID).ExecuteDeleteAsync();
                await BrojaciReakcija.OsveziAsync(Context, dogadjaj_ID);
                return Ok("Uspesno su obrisane reakije dogadjaja");
            }
            catch (Exception ex)
            {
                return BadRequest("Nisu uspesno obrisane reakcije dogadjaja " + ex.Message);
            }
        }

        // Reakcije korisnika na zadatim dogadjajima (ID-jevi odvojeni zarezom), jednim upitom
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiReakcije/{id_korisnika}/{ID_dogadjaja}")]
        public async Task<ActionResult> VratiReakcije(int id_korisnika, string ID_dogadjaja)
        {
            try
            {
                if (id_korisnika != User.IdKorisnika())
                    return Forbid();
                List<int> lista = ID_dogadjaja.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(int.Parse).ToList();
                var reakcije = await Context.Reakcije
                    .Where(r => r.Korisnik_ID == id_korisnika && lista.Contains(r.Dogadjaj_ID.Id))
                    .Select(r => new { dogadjaj_ID = r.Dogadjaj_ID.Id, reakcija_ID = r.Id, tip = r.Tip })
                    .ToListAsync();
                return Ok(reakcije);
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspešno vraćanje reakcija! " + ex.Message);
            }
        }
    }
}
