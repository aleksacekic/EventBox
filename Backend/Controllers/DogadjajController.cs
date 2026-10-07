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


        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajDogadjaj/{kreator}/{datum_objave}/{naslov}/{datum_dogadjaja}/{vreme_pocetka}/{opis}/{kategorija}/{x}/{y}")]
        public async Task<ActionResult> DodajDogadjaj(int kreator, DateTime datum_objave, string naslov
                                                      ,DateTime datum_dogadjaja, string vreme_pocetka, string opis
                                                      ,string kategorija, double x, double y)
        {
           try
            {
                if(kreator != User.IdKorisnika())
                    return Forbid(); // dogadjaj moze da napravi samo za sebe

                Korisnik k = new Korisnik();
                k = await Context.Korisnici.FindAsync(kreator);
                Dogadjaj dog = new Dogadjaj();
                dog.KreatorId = k;
                dog.ID_Kreatora = k.Id;
                dog.Datum_Objave = datum_objave;
                dog.Naslov = naslov;
                dog.Datum_Dogadjaja = datum_dogadjaja;
                dog.Vreme_pocetka = vreme_pocetka;
                dog.Opis = opis; 
                dog.Broj_Zainteresovanih = 0;
                dog.Broj_Mozda = 0;
                dog.Broj_Nezainteresovanih = 0;
                dog.Kategorija = kategorija;
                dog.X = x;
                dog.Y = y;
                dog.DogadjajImage = null;
                Context.Dogadjaji.Add(dog);
                await Context.SaveChangesAsync();
                return Ok(dog);
            }
            catch(Exception e)
            {
                return BadRequest("Nije uspesno dodat dogadjaj! " + e.Message
                    + (e.InnerException != null ? " | INNER: " + e.InnerException.Message : ""));
            }
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

        
        [HttpPut]
        [EnableCors("CORS")]
        [Route("IzmeniDogadjaj/{dogadjajID}/{datum_objave}/{naslov}/{datum_dogadjaja}/{vreme_pocetka}/{opis}/{kategorija}/{x}/{y}")]
        public async Task<ActionResult> IzmeniDogadjaj(int dogadjajID, DateTime datum_objave, string naslov
                                                      ,DateTime datum_dogadjaja, string vreme_pocetka, string opis
                                                      ,string kategorija, double x, double y)
        {
            try
            {

                Dogadjaj dog = await Context.Dogadjaji.FindAsync(dogadjajID);
                if(dog == null)
                    return NotFound();
                if(dog.ID_Kreatora != User.IdKorisnika())
                    return Forbid();
                dog.Datum_Objave = datum_objave;
                dog.Naslov = naslov;
                dog.Datum_Dogadjaja = datum_dogadjaja;
                dog.Vreme_pocetka = vreme_pocetka;
                dog.Opis = opis; 
                dog.Kategorija = kategorija;
                dog.X = x;
                dog.Y = y;
                Context.Dogadjaji.Update(dog);
                await Context.SaveChangesAsync();
                return Ok("Uspesno ste dodali novi azurirali dogadjaj " + naslov);
            }
            catch(Exception e)
            {
                return BadRequest("Nije uspesno azuriran dogadjaj! " + e.Message
                    + (e.InnerException != null ? " | INNER: " + e.InnerException.Message : ""));
            }
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
