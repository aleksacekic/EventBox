using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo;
using EventBoxApi.Repo.Abstract;
using System.Security.Cryptography;
using System.Text;

namespace EventBoxApi.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class KorisnikController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        public IFileService _fileService;
        public IKorisnikRepo _korisnikRepo;


        public KorisnikController(EventBoxContext context, IFileService fs, IKorisnikRepo kr)
        {
            Context = context;
            this._fileService = fs;
            this._korisnikRepo = kr;
        }


        [EnableCors("CORS")]
        [Route("DodajKorisnika/{ime}/{prezime}/{korisnicko_ime}/{lozinka}/{datum_rodjenja}/{email_adresa}")]
        [HttpPost]
        public async Task<ActionResult> DodajKorisnika(string ime, string prezime, string korisnicko_ime, 
                                                        string lozinka, DateTime datum_rodjenja, string email_adresa)
        {
            try
            {

                //PROVER DATUMA
                if(DateTime.Compare(new DateTime(2023,1,1), datum_rodjenja) < 0 && 
                   DateTime.Compare(new DateTime(1900,1,1), datum_rodjenja) > 0)
                   {    
                    Console.WriteLine("USO U COMPARE");
                     return Ok(new {odgovor = "DATUM"});
                   }
                   
                    
                //--------------------
                //PROVERA KORISNICKOG IMENA
                var pom = await Context.Korisnici.Where(p => p.Korisnicko_Ime == korisnicko_ime).FirstOrDefaultAsync();
                if(pom != null)
                {    
                    Console.WriteLine("USO U PROVERU KORISNICKOG IMENA");
                    return Ok(new {odgovor = "KORISNICKO_IME"});        
                }  
                //-------------------------

                Korisnik k = new Korisnik();
                k.Ime = ime;
                k.Prezime = prezime;
                k.Korisnicko_Ime = korisnicko_ime;
                k.Lozinka = lozinka;
                k.Lozinka_Hashirana = sha256_hash(lozinka);

                var guid = Guid.NewGuid();
                var token = sha256_hash(guid.ToString());
                k.Token = token;
                k.Validnost = DateTime.Now.AddMinutes(10);

                k.Datum_rodjenja = datum_rodjenja;
                k.Email_Adresa = email_adresa;
                k.KorisnikImage = null;
                k.Blokiran = 0;


                Context.Korisnici.Add(k);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je upisan korisnik sa korisnickim imenom" + korisnicko_ime);
            }
            catch (Exception e)
            {
                return BadRequest("Nije uspesno dodavanje korisnika!" + e.Message);
            }
        }

        [EnableCors("CORS")]
        [Route("IzbrisiKorisnika/{id}")]
        [HttpDelete]
        public async Task<ActionResult> IzbrisiKorisnika(int id)
        {
            try
            {
                var korisnik = await Context.Korisnici.FindAsync(id);               
                Context.Korisnici.Remove(korisnik);
                await Context.SaveChangesAsync();
                return Ok("Uspesno je obrisan korisnik sa id-em " + id);
            }
            catch(Exception e)
            {
                return BadRequest("Nije uspesno obrisan korisnik! "+ e.Message);
            }
        }
        
        [EnableCors("CORS")]
        [Route("IzmeniKorisnika")]
        [HttpPut]
        public async Task<ActionResult> IzmeniKorisnika(int id, string ime, string prezime, string korisnicko_ime,  
                                                        string lozinka, DateTime datum_rodjenja, string email_adresa)
        {
            try
            {
                Korisnik k = await Context.Korisnici.FindAsync(id);
                k.Ime = ime;
                k.Prezime = prezime;
                k.Korisnicko_Ime = korisnicko_ime;
                k.Lozinka = lozinka;
                k.Lozinka_Hashirana = sha256_hash(lozinka);
                k.Datum_rodjenja = datum_rodjenja;
                k.Email_Adresa = email_adresa;
                Context.Korisnici.Update(k);
                await Context.SaveChangesAsync();
                return Ok("Uspesno su azurirani podaci korisnika");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno azuriranje korisnika" + ex.Message);
            }

        }

        [EnableCors("CORS")]
        [Route("VratiKorisnika_ID/{id}")]
        [HttpGet]
        public async Task<ActionResult> VratiKorisnika_ID(int id) //--NE VRACA DOGADJAJE KORISNIKA--
        {
            try
            {   
                var k = await Context.Korisnici.FindAsync(id);
                return Ok(k);
            }
            catch (Exception e)
            {
                return BadRequest("Nije uspesno vracen korisnik "+e.Message);
            }
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuKorisniku")]
        public IActionResult AddImage(IFormFile fajl, int id_korisnika) //Trebalo bi [FromForm] za fetch
        {
            Korisnik model = Context.Korisnici.Where(p => p.Id == id_korisnika).Include(p => p.Kreirani_Dogadjaji).First();
            model.ImageFile = fajl;
            var status = new Status();
            string pom = "";

            if(model.ImageFile != null)
            {
                var fileResult = _fileService.SaveImage(model.ImageFile);
                if(fileResult.Item1 == 1)
                {
                    model.KorisnikImage = fileResult.Item2;
                }
                var korisnikResult = _korisnikRepo.Add(model);
                if(korisnikResult)
                {
                    pom = model.KorisnikImage;
                    status.StatusCode = 1;
                    status.Message = pom;
		    model.Kreirani_Dogadjaji.ForEach(elem => {
			elem.SlikaKorisnika = pom;			
			});
		Context.Korisnici.Update(model);
		Context.SaveChanges();
		
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
        [Route("IzbrisiSlikuKorisnika/{korisnik_id}")]
        public async Task<ActionResult> IzbrisiSlikuKorisnika(int korisnik_id)
        {
            try
            {
                Korisnik k = await Context.Korisnici.FindAsync(korisnik_id);
                if(_fileService.DeleteImage(k.KorisnikImage))
                {
                    k.KorisnikImage = null;
                    await Context.SaveChangesAsync();
                    return Ok("Uspesno izbrisana slika");
                }
                return BadRequest("Nije uspesno obrisano");
                                
                
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana slika korisnika " + ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("LogovanjeKorisnik/{username}/{password}")]
        public async Task<ActionResult> LogovanjeKorisnik(string username, string password) //proveriti da li je korisnik blokiran
        {
            try
            {
                string hash_lozinka = sha256_hash(password);
                Korisnik k  = await Context.Korisnici.Where(p => p.Korisnicko_Ime == username && p.Lozinka_Hashirana == hash_lozinka).FirstOrDefaultAsync();

                if(k == null)
                    return Ok(new {nema = "NEMA_KORISNIKA"});
                if(k.Blokiran == -1)
                    return Ok(new {blokiran = "BLOKIRAN"});

                int korisnikov_id = k.Id;
                
                //Dodela tokena
                var guid = Guid.NewGuid();
                var token = sha256_hash(guid.ToString());
                k.Token = token;
                k.Validnost = DateTime.Now.AddMinutes(30);
		

                Context.Korisnici.Update(k);
                await Context.SaveChangesAsync();

                return Ok(new {token=k.Token, userID = k.Id});
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje korisnika "+ex.Message);
            }
        
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajeKorisnika/{korisnik_Id}/{broj_posiljke}/{ukupno_elemenata}")]
        public async Task<ActionResult> VratiDogadjajeKorisnika(int korisnik_Id, int broj_posiljke, int ukupno_elemenata)
        {
            try
            {
		await Validnost.Validiraj(Context, Request);
                Korisnik k = await Context.Korisnici.Where(p => p.Id == korisnik_Id).Include(p => p.Kreirani_Dogadjaji).FirstOrDefaultAsync();

                int skok = 3; 
                int ukupno = ukupno_elemenata;

                if(ukupno == 0)
                    ukupno = k.Kreirani_Dogadjaji.Count();

                int pom = ukupno - broj_posiljke * skok;

                if(pom <= skok * (-1))
                    return Ok(new {kraj="KRAJ"});

                if(pom < 0 && pom > skok * (-1))
                {
                    var dogadjaji2 = k.Kreirani_Dogadjaji.Take(skok + pom).ToList();
                    var odgovor2 = new {
                        Ukupno_elemenata = ukupno,
                        Broj_posiljke = broj_posiljke,
                        Dogadjaji = dogadjaji2
                    };

                return Ok(odgovor2); //odgovor2
                }
                    
                var dogadjaji = k.Kreirani_Dogadjaji.Skip(pom).Take(skok).ToList();

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
        [Route("VratiNotifikacijeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiNotifikacijeKorisnika(int korisnik_Id)
        {
            Console.WriteLine("USO U NOTIFIKACIJE");
            //await Validnost.Validiraj(Context, Request);
            Korisnik k = await Context.Korisnici.Where(p => p.Id == korisnik_Id).Include(p => p.Lista_Notifikacija).FirstOrDefaultAsync();
            Console.WriteLine(k.Lista_Notifikacija);
            Console.WriteLine("GOTOVE NOTIFIKACIJE");
            return Ok(k.Lista_Notifikacija);
        }


        [HttpPut]
        [EnableCors("CORS")]
        [Route("BlokirajKorisnika/{korisnik_id}")]
        public async Task<ActionResult> BlokirajKorisnika(int korisnik_id)
        {
            try
            {
                Korisnik k  = await Context.Korisnici.FindAsync(korisnik_id);
                if(k != null)
                {
                    k.Blokiran = -1;
                    Context.Korisnici.Update(k);
                    await Context.SaveChangesAsync();
                    return Ok("Uspesno je blokiran korisnik");
                }
                return BadRequest($"Korisnik sa id-em: {korisnik_id} nije pornadjen u bazi!");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno blokiran korisnik "+ex.Message);
            }
        } 

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKorisnikeSearch/{unos}")]
        public async Task<ActionResult> VratiKorisnikeSearch(string unos)
        {
            try
            {
                string[] niz = unos.Split(" "); //Front sprecava korisnika da unese prazan string, tako da ce uvek biti minimum 1
                niz = niz.Where(p => !string.IsNullOrEmpty(p)).ToArray(); //brisanje praznih stringova ukoliko se jave

                if(niz.Length == 1)
                {
                    var korisnici = await Context.Korisnici.Where(p => p.Ime.Contains(niz[0]) || 
                                                                    p.Prezime.Contains(niz[0]) || 
                                                                    p.Korisnicko_Ime.Contains(niz[0])).Take(6).ToListAsync();
                    if(korisnici.Count() == 0)
                        return Ok(new {kraj = "KRAJ"});
                    return Ok(korisnici.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
                }
                else
                {
                    var korisnici2 = await Context.Korisnici.Where(p => p.Ime.Contains(niz[0]) && p.Prezime.Contains(niz[1])).Take(6).ToListAsync();
                    if(korisnici2.Count() == 0)
                    {
                        korisnici2 = await Context.Korisnici.Where(p => p.Ime.Contains(niz[1]) && p.Prezime.Contains(niz[0])).Take(6).ToListAsync();
                        if(korisnici2.Count() == 0)
                            return Ok(new {kraj = "KRAJ"});
                        return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList());
                    }

                    return Ok(korisnici2.Select(p => new {ID = p.Id, Korisnicko_Ime = p.Korisnicko_Ime, Ime = p.Ime, Prezime = p.Prezime}).ToList()); 
                }
            }
            catch(Exception ex)
            {
                return BadRequest("Nisu uspesno vracni korisnici "+ex.Message);
            }
        }

        public static String sha256_hash(string value)
        {
            StringBuilder Sb = new StringBuilder();

            using (var hash = SHA256.Create())            
            {
                Encoding enc = Encoding.UTF8;
                byte[] result = hash.ComputeHash(enc.GetBytes(value));

                foreach (byte b in result)
                    Sb.Append(b.ToString("x2"));
            }

            return Sb.ToString();
        }  

        [HttpGet]
        [EnableCors("CORS")]
        [Route("ProveriToken")]
        public async Task<ActionResult> ProveriToken([FromBody] Korisnik k)
        {
            try
            {
                Korisnik baza_korisnik = await Context.Korisnici.Where(p => p.Id == k.Id).FirstAsync();
                if(baza_korisnik == null)
                    return BadRequest("Postoji problem sa nalazenjem korisnika u bazi!");
                if(k.Token != baza_korisnik.Token || DateTime.Compare(DateTime.Now, baza_korisnik.Validnost) > 0)
                    return Ok(new {nevalidan = "NEVALIDAN"});
                
                baza_korisnik.Validnost = DateTime.Now.AddMinutes(30);
                Context.Korisnici.Update(baza_korisnik);
                await Context.SaveChangesAsync();

                return Ok(new {validan = "VALIDAN"});
            }
            catch(Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }   
    }
}
