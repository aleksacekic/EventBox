using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; 
using Models;
using EventBoxApi.Repo;
using EventBoxApi.Repo.Abstract;

namespace EventBoxApi.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class DogadjajController : ControllerBase
    {
        public EventBoxContext Context;
        public IFileService _fileService;
        public IDogadjajRepo _dogadjajRepo;
        public DogadjajController(EventBoxContext context, IFileService fs, IDogadjajRepo dr)
        {
            this.Context = context;
            this._fileService = fs;
            this._dogadjajRepo = dr;
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjaj/{id}")]
        public async Task<ActionResult> VratiDogadjaj(int id)
        {
            try
            {
                var dogadjaj = await Context.Dogadjaji.Include(d => d.KreatorId).FirstOrDefaultAsync(d => d.Id == id);
                if (dogadjaj == null)
                {
                    return NotFound($"Događaj sa ID-em {id} nije pronađen.");
                }

                return Ok(dogadjaj);
            }
            catch (Exception e)
            {
                return BadRequest($"Greška prilikom vraćanja događaja: {e.Message}");
            }
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
            try
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
                return Ok($"Uspesno je izbrisan dogadjaj sa ID-em {id}");
            }
            catch(Exception e)
            {
                return BadRequest("Nije uspesno izbrisan dogadjaj! " + e.Message);
            }
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

        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuDogadjaju")]
        public IActionResult AddImage(IFormFile fajl,int dogadjaj_id)
        {
            Console.WriteLine("Uso sam u funkciju");
            Dogadjaj model = Context.Dogadjaji.FirstOrDefault(p => p.Id == dogadjaj_id);
            if(model == null)
                return NotFound();
            if(model.ID_Kreatora != User.IdKorisnika())
                return Forbid();
            model.ImageFile = fajl;
            Console.WriteLine("Ucitao sam dogadjaj" + model.Id);

            var status = new Status();
            string pom = "";

          if(model.ImageFile != null)
                    {
                        var fileResult = _fileService.SaveImage(model.ImageFile);
                        if(fileResult.Item1 == 1)
                        {
                            model.DogadjajImage = fileResult.Item2;
                        }
                        var dogadjajResult = _dogadjajRepo.Add(model);
                        if(dogadjajResult)
                        {
                            pom = model.DogadjajImage;
                            status.StatusCode = 1;
                            status.Message = pom;
                        }
                        else
                        {
                            status.StatusCode = 0;
                            status.Message = "Greska pri dodavanju slike";
                        }
                        return Ok(status);
                    }
            return Ok(status);


}


        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbirsiSlikuDogadjaja/{dogadjaj_id}")]
        public async Task<ActionResult> IzbrisiSlikuDogadjaja(int dogadjaj_id)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_id);
                if(d == null)
                    return NotFound();
                if(d.ID_Kreatora != User.IdKorisnika())
                    return Forbid();
                if(_fileService.DeleteImage(d.DogadjajImage))
                {
                    d.DogadjajImage = null;
                    await Context.SaveChangesAsync();
                    return Ok("Uspesno izbrisana slika");
                }
                return BadRequest("Nije uspesno obrisano");
                                
                
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana slika dogadjaja " + ex.Message);
            }
        }
        
        // Liste dogadjaja: najnoviji prvi, stranicenje kursorom (Models/Paginacija.cs).
        //   ?limit=3                -> prva strana
        //   ?limit=3&cursor=<kursor> -> sledeca (kursor = sledeciKursor iz prethodnog odgovora)
        // Odgovor: { stavke, sledeciKursor, imaJos, ukupno }  (ukupno samo uz prvu stranu)
        private async Task<ActionResult> StranaDogadjaja(IQueryable<Dogadjaj> upit, int limit, string? cursor)
        {
            try
            {
                if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                    return BadRequest("Neispravan kursor");
                return Ok(await Paginacija.UzmiAsync(upit.Include(d => d.KreatorId), posle, limit));
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje dogadjaja: " + ex.Message);
            }
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
