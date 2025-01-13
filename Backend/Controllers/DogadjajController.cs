using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; 
using Models;
using EventBoxApi.Repo;
using EventBoxApi.Repo.Abstract;

namespace EventBoxApi.Controllers
{
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

        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajDogadjaj/{kreator}/{datum_objave}/{naslov}/{datum_dogadjaja}/{vreme_pocetka}/{opis}/{kategorija}/{x}/{y}")]
        public async Task<ActionResult> DodajDogadjaj(int kreator, DateTime datum_objave, string naslov
                                                      ,DateTime datum_dogadjaja, string vreme_pocetka, string opis
                                                      ,string kategorija, double x, double y)
        {
           try
            {
                Korisnik k = new Korisnik();
                k = await Context.Korisnici.FindAsync(kreator);
                Dogadjaj dog = new Dogadjaj();
                dog.KreatorId = k;
                dog.ID_Kreatora = k.Id;
                dog.UserName_Kreatora = k.Korisnicko_Ime;
                dog.SlikaKorisnika = k.KorisnikImage;
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
                return BadRequest("Nije uspesno dodat dogadjaj! " + e.Message);
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
                Korisnik k = await Context.Korisnici.FindAsync(dog.ID_Kreatora);
                dog.Datum_Objave = datum_objave;
                dog.UserName_Kreatora = k.Korisnicko_Ime;
                dog.SlikaKorisnika = k.KorisnikImage;
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
                return BadRequest("Nije uspesno azuriran dogadjaj! " + e.Message);
            }
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuDogadjaju")]
        public IActionResult AddImage(IFormFile fajl,int dogadjaj_id)
        {
            Console.WriteLine("Uso sam u funkciju");
            Dogadjaj model = Context.Dogadjaji.FirstOrDefault(p => p.Id == dogadjaj_id);
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
        
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajeZaHomePage/{broj_posiljke}/{ukupno_elemenata}")]
        public async Task<ActionResult> VratiDogadjajeZaHomePage(int broj_posiljke, int ukupno_elemenata) //Broj posiljke uvek krece od 1
        {                                                                                                 //Salje se inicijalno 0 za prvi poziv funkcije u sesiji
            try
            {
                await Validnost.Validiraj(Context, Request);
                
                DateTime danas = DateTime.Today;
                DateTime danas_norm = new DateTime(danas.Year,danas.Month,danas.Day); //Normalizovan danasnji datum

                IQueryable<Dogadjaj> _query = Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas_norm); //Filtriran Context
                
                int skok = 3; //Broj objekta koji se vraca
                int ukupno = ukupno_elemenata;

                if(ukupno == 0)
                    ukupno = _query.Count();

                int pom = ukupno - broj_posiljke * skok;

                if(pom <= skok * (-1))
                    return Ok(new {kraj = "KRAJ"});

                if(pom < 0 && pom > skok * (-1))
                {                 
                    var dogadjaji2 = await _query.Take(skok + pom).ToListAsync();
                    
                    var odgovor2 = new {
                        Ukupno_elemenata = ukupno,
                        Broj_posiljke = broj_posiljke,
                        Dogadjaji = dogadjaji2
                    };

                return Ok(odgovor2);
                }

                var dogadjaji = await  _query.Skip(pom).Take(skok).ToListAsync();

                var odgovor = new {
                    Ukupno_elemenata = ukupno,
                    Broj_posiljke = broj_posiljke,
                    Dogadjaji = dogadjaji
                };

                return Ok(odgovor);
            }
            catch(AUTHException)
            {
                return StatusCode(401);
            }
            catch(Exception ex)
            {
                return BadRequest($"Nije uspelo vracanje posiljke: {broj_posiljke}, ukupno elementa: {ukupno_elemenata} "+ex.Message);
            }
        }
      
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajePoDatumu/{datum}/{broj_posiljke}/{ukupno_elemenata}")]
        public async Task<ActionResult> VratiDogadjajePoDatumu(DateTime datum, int broj_posiljke, int ukupno_elemenata)
        {
            try
            {
                await Validnost.Validiraj(Context, Request);
                int skok = 3; //Broj objekta koji se vraca
                int ukupno = ukupno_elemenata;

                if(ukupno == 0)
                    ukupno = Context.Dogadjaji.Where(p => p.Datum_Dogadjaja == datum).Count();

                int pom = ukupno - broj_posiljke * skok;

                if(pom <= skok * (-1))
                    return Ok(new {kraj = "KRAJ"});

                if(pom < 0 && pom > skok * (-1))
                {
                    var dogadjaji2 = await Context.Dogadjaji.Where(p => p.Datum_Dogadjaja == datum).Take(skok + pom).ToListAsync();
                    var odgovor2 = new {
                        Ukupno_elemenata = ukupno,
                        Broj_posiljke = broj_posiljke,
                        Dogadjaji = dogadjaji2
                    };

                return Ok(odgovor2);
                }
                    
                var dogadjaji = await Context.Dogadjaji.Where(p => p.Datum_Dogadjaja == datum).Skip(pom).Take(skok).ToListAsync();

                var odgovor = new {
                    Ukupno_elemenata = ukupno,
                    Broj_posiljke = broj_posiljke,
                    Dogadjaji = dogadjaji
                };

                return Ok(odgovor);
                
            }
            catch(Exception ex)
            {
                return BadRequest($"Nije uspelo vracanje posiljke: {broj_posiljke}, ukupno elementa: {ukupno_elemenata} "+ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajePoNazivu/{naziv}/{broj_posiljke}/{ukupno_elemenata}")]
        public async Task<ActionResult> VratiDogadjajePoNazivu(string naziv, int broj_posiljke, int ukupno_elemenata)
        {
            try
            {
                await Validnost.Validiraj(Context, Request);
                DateTime danas = DateTime.Today;
                DateTime danas_norm = new DateTime(danas.Year,danas.Month,danas.Day); //Normalizovan danasnji datum

                IQueryable<Dogadjaj> _query = Context.Dogadjaji.Where(d => d.Datum_Dogadjaja >= danas_norm); //Filtriran Context

                int skok = 3; //Broj objekta koji se vraca
                int ukupno = ukupno_elemenata;

                if(ukupno == 0)
                    ukupno = _query.Where(p => p.Naslov.Contains(naziv)).Count();

                int pom = ukupno - broj_posiljke * skok;

                if(pom <= skok * (-1))
                    return Ok(new {kraj = "KRAJ"});

                if(pom < 0 && pom > skok * (-1))
                {
                    var dogadjaji2 = await _query.Where(p => p.Naslov.Contains(naziv)).Take(skok + pom).ToListAsync();

                    var odgovor2 = new {
                        Ukupno_elemenata = ukupno,
                        Broj_posiljke = broj_posiljke,
                        Dogadjaji = dogadjaji2
                    };

                return Ok(odgovor2);
                }
                    
                var dogadjaji = await _query.Where(p => p.Naslov.Contains(naziv)).Skip(pom).Take(skok).ToListAsync();

                var odgovor = new {
                    Ukupno_elemenata = ukupno,
                    Broj_posiljke = broj_posiljke,
                    Dogadjaji = dogadjaji
                };

                return Ok(odgovor);
                
            }
            catch(Exception ex)
            {
                return BadRequest($"Nije uspelo vracanje posiljke: {broj_posiljke}, ukupno elementa: {ukupno_elemenata} "+ex.Message);
            }
        }
    }
}