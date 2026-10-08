using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; 
using Models;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;

namespace EventBoxApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class DogadjajController : ControllerBase
    {
        public EventBoxContext Context;
        public IFileService _fileService;
        public DogadjajController(EventBoxContext context, IFileService fs)
        {
            this.Context = context;
            this._fileService = fs;
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjaj/{id}")]
        public async Task<ActionResult> VratiDogadjaj(int id)
        {
            var dogadjaj = await Context.Dogadjaji.Include(d => d.KreatorId).FirstOrDefaultAsync(d => d.Id == id);
            if (dogadjaj == null)
            {
                return NotFound($"Događaj sa ID-em {id} nije pronađen.");
            }

            return Ok(dogadjaj);
        }


        // Novi dogadjaj ulogovanog korisnika. Podaci idu u telu (DogadjajZahtev); kreator i datum
        // objave postavlja server. Neispravan unos -> 400 { message, greske: { polje: poruka } }.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajDogadjaj")]
        public async Task<ActionResult> DodajDogadjaj([FromBody] DogadjajZahtev zahtev)
        {
            if (User.JeAdmin())
                return Forbid(); // administrator nije korisnik i nema dogadjaje
            if (zahtev == null)
                return BadRequest("Nedostaju podaci o dogadjaju");
            var greske = zahtev.Proveri();
            if (greske.Count > 0)
                return BadRequest(new { message = "Proverite unete podatke.", greske });

            var dog = new Dogadjaj
            {
                ID_Kreatora = User.IdKorisnika(),
                Datum_Objave = DateTime.Today,
                DogadjajImage = null,
            };
            zahtev.PrimeniNa(dog);
            Context.Dogadjaji.Add(dog);
            await Context.SaveChangesAsync();

            // isti oblik kao u listama (sa imenom i slikom kreatora), da kartica odmah ima sve
            await Context.Entry(dog).Reference(d => d.KreatorId).LoadAsync();
            return Ok(dog);
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiDogadjaj/{id}")]
        public async Task<ActionResult> IzbrisiDogadjaj(int id)
        {
            var dog = await Context.Dogadjaji.FindAsync(id);
            if(dog == null)
                return NotFound($"Dogadjaj sa ID-em {id} nije pronadjen");
            if(dog.ID_Kreatora != User.IdKorisnika() && !User.JeAdmin())
                return Forbid(); // brise vlasnik ili administrator

            // Notifikacija cuva samo DogadjajId (bez FK), baza je ne brise sama
            var notifikacije = Context.Notifikacije.Where(n => n.DogadjajId == id);
            Context.Notifikacije.RemoveRange(notifikacije);

            Context.Dogadjaji.Remove(dog);
            await Context.SaveChangesAsync();
            _fileService.ObrisiSliku(dog.DogadjajImage); // tek kad je dogadjaj stvarno obrisan
            return Ok($"Uspesno je izbrisan dogadjaj sa ID-em {id}");
        }    

        
        // Izmena dogadjaja (samo kreator), isto telo i ista pravila kao pri pravljenju. Datum vec
        // odrzanog dogadjaja moze ostati isti, iako je u proslosti.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("IzmeniDogadjaj/{dogadjajID}")]
        public async Task<ActionResult> IzmeniDogadjaj(int dogadjajID, [FromBody] DogadjajZahtev zahtev)
        {
            Dogadjaj dog = await Context.Dogadjaji.Include(d => d.KreatorId).FirstOrDefaultAsync(d => d.Id == dogadjajID);
            if(dog == null)
                return NotFound();
            if(dog.ID_Kreatora != User.IdKorisnika())
                return Forbid();
            if (zahtev == null)
                return BadRequest("Nedostaju podaci o dogadjaju");
            var greske = zahtev.Proveri(dozvoliProsliDatum: dog.Datum_Dogadjaja);
            if (greske.Count > 0)
                return BadRequest(new { message = "Proverite unete podatke.", greske });

            zahtev.PrimeniNa(dog);
            await Context.SaveChangesAsync();
            return Ok(dog);
        }

        // Postavlja ili menja sliku dogadjaja (multipart, polje "fajl"). Odgovor: { slika } -
        // ime novog fajla. Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuDogadjaju")]
        [RequestSizeLimit(FileService.MaxVelicina + 64 * 1024)] // + malo za zaglavlja multipart-a
        public async Task<ActionResult> DodajSlikuDogadjaju([FromForm] IFormFile? fajl, [FromQuery] int dogadjaj_id)
        {
            Dogadjaj? d = await Context.Dogadjaji.FindAsync(dogadjaj_id);
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.IdKorisnika())
                return Forbid();

            var rezultat = await _fileService.SacuvajSlikuAsync(fajl);
            if (rezultat.Greska != null)
                return BadRequest(new { message = rezultat.Greska });

            string? stara = d.DogadjajImage;
            d.DogadjajImage = rezultat.Ime;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.ObrisiSliku(rezultat.Ime); // upis nije uspeo - nova slika ne sme da ostane siroce
                throw;
            }
            _fileService.ObrisiSliku(stara);
            return Ok(new { slika = d.DogadjajImage });
        }

        // Uklanja sliku dogadjaja. Referenca u bazi se brise i ako fajla vise nema na disku.
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiSlikuDogadjaja/{dogadjaj_id}")]
        [Route("IzbirsiSlikuDogadjaja/{dogadjaj_id}")] // stara ruta (greska u kucanju), ostaje radi kompatibilnosti
        public async Task<ActionResult> IzbrisiSlikuDogadjaja(int dogadjaj_id)
        {
            Dogadjaj? d = await Context.Dogadjaji.FindAsync(dogadjaj_id);
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.IdKorisnika())
                return Forbid();
            string? stara = d.DogadjajImage;
            d.DogadjajImage = null;
            await Context.SaveChangesAsync();
            _fileService.ObrisiSliku(stara);
            return Ok("Uspesno izbrisana slika");
        }

        // Liste dogadjaja: najnoviji prvi, stranicenje kursorom (Models/Paginacija.cs).
        //   ?limit=3                -> prva strana
        //   ?limit=3&cursor=<kursor> -> sledeca (kursor = sledeciKursor iz prethodnog odgovora)
        // Odgovor: { stavke, sledeciKursor, imaJos, ukupno }  (ukupno samo uz prvu stranu)
        private async Task<ActionResult> StranaDogadjaja(IQueryable<Dogadjaj> upit, int limit, string? cursor)
        {
            if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                return BadRequest("Neispravan kursor");
            return Ok(await Paginacija.UzmiAsync(upit.Include(d => d.KreatorId), posle, limit));
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajeZaHomePage")]
        public Task<ActionResult> VratiDogadjajeZaHomePage([FromQuery] int limit = Paginacija.PodrazumevanaVelicina, [FromQuery] string? cursor = null)
        {
            DateTime danas = DateTime.Today;
            return StranaDogadjaja(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas), limit, cursor);
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajePoDatumu")]
        public Task<ActionResult> VratiDogadjajePoDatumu([FromQuery] DateTime datum, [FromQuery] int limit = Paginacija.PodrazumevanaVelicina, [FromQuery] string? cursor = null)
        {
            DateTime od = datum.Date;
            DateTime do_ = od.AddDays(1);
            return StranaDogadjaja(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= od && d.Datum_Dogadjaja < do_), limit, cursor);
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajePoNazivu")]
        public async Task<ActionResult> VratiDogadjajePoNazivu([FromQuery] string naziv, [FromQuery] int limit = Paginacija.PodrazumevanaVelicina, [FromQuery] string? cursor = null)
        {
            if (string.IsNullOrWhiteSpace(naziv))
                return BadRequest("Naziv je obavezan");
            DateTime danas = DateTime.Today;
            return await StranaDogadjaja(Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas && d.Naslov.Contains(naziv)), limit, cursor);
        }
    }
}
