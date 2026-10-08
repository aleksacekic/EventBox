using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo;
using EventBoxApi.Repo.Abstract;
using System.Security.Cryptography;
using System.Text;

namespace EventBoxApi.Controllers
{

    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class KorisnikController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        public IFileService _fileService;
        public IKorisnikRepo _korisnikRepo;
        private readonly Obavestenja _obavestenja;
        private readonly ZastitaPrijave _zastita;


        public KorisnikController(EventBoxContext context, IFileService fs, IKorisnikRepo kr, Obavestenja obavestenja, ZastitaPrijave zastita)
        {
            Context = context;
            this._fileService = fs;
            this._korisnikRepo = kr;
            _obavestenja = obavestenja;
            _zastita = zastita;
        }


        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(ZastitaPrijave.PolitikaRegistracija)]
        [Route("DodajKorisnika")]
        [HttpPost]
        public async Task<ActionResult> DodajKorisnika([FromBody] RegistracijaZahtev zahtev)
        {
            try
            {
                if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.Ime) || string.IsNullOrWhiteSpace(zahtev.Prezime)
                    || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme) || string.IsNullOrWhiteSpace(zahtev.EmailAdresa)
                    || string.IsNullOrEmpty(zahtev.Lozinka) || zahtev.Lozinka.Length < 8)
                    return BadRequest("Sva polja su obavezna, a lozinka mora imati najmanje 8 karaktera");

                zahtev.KorisnickoIme = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
                var greskaImena = KorisnickoIme.Proveri(zahtev.KorisnickoIme);
                if (greskaImena != null)
                    return BadRequest(greskaImena);

                // Datum rodjenja mora biti izmedju 1900. i danas
                if (zahtev.DatumRodjenja < new DateTime(1900, 1, 1) || zahtev.DatumRodjenja > DateTime.Today)
                    return Ok(new {odgovor = "DATUM"});

                var pom = await Context.Korisnici.Where(p => p.Korisnicko_Ime == zahtev.KorisnickoIme).FirstOrDefaultAsync();
                if(pom != null)
                    return Ok(new {odgovor = "KORISNICKO_IME"});

                Korisnik k = new Korisnik();
                k.Ime = zahtev.Ime;
                k.Prezime = zahtev.Prezime;
                k.Korisnicko_Ime = zahtev.KorisnickoIme;
                k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);
                k.Token = NoviToken();
                k.Validnost = DateTime.Now.AddMinutes(10);
                k.Datum_rodjenja = zahtev.DatumRodjenja;
                k.Email_Adresa = zahtev.EmailAdresa;
                k.KorisnikImage = null;
                k.Blokiran = 0;

                Context.Korisnici.Add(k);
                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException e) when (KorisnickoIme.JeDuplikat(e))
                {
                    // Neko je isto ime zauzeo izmedju provere gore i upisa
                    return Ok(new {odgovor = "KORISNICKO_IME"});
                }
                return Ok("Uspesno je upisan korisnik sa korisnickim imenom " + zahtev.KorisnickoIme);
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
                if (id != User.IdKorisnika())
                    return Forbid(); // nalog brise samo njegov vlasnik
                var korisnik = await Context.Korisnici.FindAsync(id);
                if (korisnik == null)
                    return NotFound();
                // Komentari na tudjim dogadjajima nemaju kaskadu u bazi (vidi EventBoxContext);
                // oni na sopstvenim dogadjajima se brisu kaskadno zajedno sa dogadjajima
                Context.Komentari.RemoveRange(Context.Komentari.Where(k => k.AutorId == id));
                // Isto za reakcije; posle brisanja se brojaci tih tudjih dogadjaja ponovo racunaju
                var reagovaoNa = await Context.Reakcije
                    .Where(r => r.Korisnik_ID == id && r.Dogadjaj_ID.ID_Kreatora != id)
                    .Select(r => r.Dogadjaj_ID.Id)
                    .ToArrayAsync();
                Context.Reakcije.RemoveRange(Context.Reakcije.Where(r => r.Korisnik_ID == id));
                // Poruke (poslate i primljene) i notifikacije koje je izazvao na tudjim objavama
                // Njegove prijave ostaju (moderaciji treba razlog), samo gube podatak ko je prijavio
                foreach (var razlog in await Context.Razlozi.Where(r => r.PrijavioId == id).ToListAsync())
                    razlog.PrijavioId = null;
                Context.Poruke.RemoveRange(Context.Poruke.Where(m => m.PosiljaocId == id || m.PrimaocId == id));
                var uklonjene = await _obavestenja.UkloniAsync(Context.Notifikacije.Where(n => n.KorisnikKojiReagujeId == id));
                Context.Korisnici.Remove(korisnik);
                await Context.SaveChangesAsync();
                await BrojaciReakcija.OsveziAsync(Context, reagovaoNa);
                await _obavestenja.JaviUklonjeneAsync(uklonjene); // vlasnicima tih objava nestaju uzivo
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
        public async Task<ActionResult> IzmeniKorisnika(int id, [FromBody] IzmenaKorisnikaZahtev zahtev)
        {
            try
            {
                if (id != User.IdKorisnika())
                    return Forbid(); // menja samo svoj nalog
                if (zahtev == null || string.IsNullOrWhiteSpace(zahtev.Ime) || string.IsNullOrWhiteSpace(zahtev.Prezime)
                    || string.IsNullOrWhiteSpace(zahtev.KorisnickoIme) || string.IsNullOrWhiteSpace(zahtev.EmailAdresa))
                    return BadRequest("Sva polja su obavezna");
                if (!string.IsNullOrEmpty(zahtev.Lozinka) && zahtev.Lozinka.Length < 8)
                    return BadRequest("Lozinka mora imati najmanje 8 karaktera");

                zahtev.KorisnickoIme = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);
                var greskaImena = KorisnickoIme.Proveri(zahtev.KorisnickoIme);
                if (greskaImena != null)
                    return BadRequest(greskaImena);

                Korisnik k = await Context.Korisnici.FindAsync(id);
                if (k == null)
                    return NotFound();

                if (k.Korisnicko_Ime != zahtev.KorisnickoIme &&
                    await Context.Korisnici.AnyAsync(p => p.Korisnicko_Ime == zahtev.KorisnickoIme))
                    return Ok(new {odgovor = "KORISNICKO_IME"});

                k.Ime = zahtev.Ime;
                k.Prezime = zahtev.Prezime;
                k.Korisnicko_Ime = zahtev.KorisnickoIme;
                if (!string.IsNullOrEmpty(zahtev.Lozinka))
                    k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);
                k.Datum_rodjenja = zahtev.DatumRodjenja;
                k.Email_Adresa = zahtev.EmailAdresa;
                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException e) when (KorisnickoIme.JeDuplikat(e))
                {
                    return Ok(new {odgovor = "KORISNICKO_IME"});
                }
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
                // Samo javna polja - bez lozinke, heša i tokena (vidi KorisnikJavniDto)
                var k = await Context.Korisnici
                    .Where(p => p.Id == id)
                    .Select(KorisnikJavniDto.Projekcija)
                    .FirstOrDefaultAsync();
                if(k == null)
                    return NotFound($"Korisnik sa ID-em {id} nije pronadjen");
                return Ok(k);
            }
            catch (Exception e)
            {
                return BadRequest("Nije uspesno vracen korisnik "+e.Message);
            }
        }

        [EnableCors("CORS")]
        [Route("VratiSveKorisnikeOsim/{id}")]
        [HttpGet]
        public async Task<ActionResult> VratiSveKorisnike(int id) 
        {
            try
            {
                //svi korisnici osim ulogovanog (preko ID-a), samo javna polja
                var korisniciBezUlogovanog = await Context.Korisnici
                    .Where(k => k.Id != id)
                    .Select(KorisnikJavniDto.Projekcija)
                    .ToListAsync();

                return Ok(korisniciBezUlogovanog);
            }
            catch (Exception e)
            {
                return BadRequest("Nije uspelo vraćanje korisnika: " + e.Message);
            }
        }


        [HttpPost]
        [EnableCors("CORS")]
        [Route("DodajSlikuKorisniku")]
        public IActionResult AddImage(IFormFile fajl, int id_korisnika) //Trebalo bi [FromForm] za fetch
        {
            if (id_korisnika != User.IdKorisnika())
                return Forbid();
            Korisnik model = Context.Korisnici.Where(p => p.Id == id_korisnika).First();
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

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKategorijeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiKategorijeKorisnika(int korisnik_Id)
        {
            try
            {

                var kategorije = await Context.Dogadjaji
                    .Where(d => d.ID_Kreatora == korisnik_Id)
                    .GroupBy(d => d.Kategorija)
                    .Select(g => new { Kategorija = g.Key, Broj = g.Count() })
                    .OrderByDescending(x => x.Broj)
                    .ThenBy(x => x.Kategorija)
                    .ToListAsync();

                return Ok(kategorije);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje kategorija korisnika: " + ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiSlikuKorisnika/{korisnik_id}")]
        public async Task<ActionResult> IzbrisiSlikuKorisnika(int korisnik_id)
        {
            try
            {
                if (korisnik_id != User.IdKorisnika())
                    return Forbid();
                Korisnik k = await Context.Korisnici.FindAsync(korisnik_id);
                if(k == null)
                    return BadRequest("Korisnik ne postoji");

                // Fajl moze vec da fali na disku - referenca u bazi se svakako cisti
                _fileService.DeleteImage(k.KorisnikImage);
                k.KorisnikImage = null;
                await Context.SaveChangesAsync();
                return Ok("Uspesno izbrisana slika");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisana slika korisnika " + ex.Message);
            }
        }

        [HttpPost]
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(ZastitaPrijave.PolitikaPrijava)]
        [Route("LogovanjeKorisnik")]
        public async Task<ActionResult> LogovanjeKorisnik([FromBody] PrijavaZahtev zahtev)
        {
            try
            {
                if (zahtev == null || string.IsNullOrEmpty(zahtev.KorisnickoIme) || string.IsNullOrEmpty(zahtev.Lozinka))
                    return Ok(new {nema = "NEMA_KORISNIKA"});

                string ime = KorisnickoIme.Normalizuj(zahtev.KorisnickoIme);

                // Zakljucano ime (previse pogresnih lozinki) se odbija pre provere lozinke
                if (_zastita.Zakljucan("k", ime) is TimeSpan preostalo)
                    return Zakljucano(preostalo);

                Korisnik k = await Context.Korisnici.Where(p => p.Korisnicko_Ime == ime).FirstOrDefaultAsync();

                // Isti odgovor za nepostojeceg korisnika i pogresnu lozinku; broji se i nepostojece
                // ime, da se iz zakljucavanja ne bi videlo koja imena postoje
                if (k == null || !Lozinke.Proveri(k.Lozinka_Hashirana, zahtev.Lozinka, out bool ponovoHesirati))
                {
                    _zastita.Neuspeh("k", ime);
                    return Ok(new {nema = "NEMA_KORISNIKA"});
                }
                _zastita.Uspeh("k", ime);
                if (k.Blokiran == -1)
                    return Ok(new {blokiran = "BLOKIRAN"});

                // Heš sa slabijim podesavanjima (npr. manje iteracija) se pri prijavi osvezava
                if (ponovoHesirati)
                    k.Lozinka_Hashirana = Lozinke.Hesiraj(zahtev.Lozinka);

                // Dodela tokena
                k.Token = NoviToken();
                k.Validnost = DateTime.Now.AddMinutes(30);

                await Context.SaveChangesAsync();

                return Ok(new {token=k.Token, userID = k.Id});
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje korisnika "+ex.Message);
            }
        }

        // Dogadjaji korisnika za profil: najnoviji prvi, stranicenje kursorom (vidi DogadjajController)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiDogadjajeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiDogadjajeKorisnika(int korisnik_Id, [FromQuery] int limit = Paginacija.PodrazumevanaVelicina, [FromQuery] string? cursor = null)
        {
            try
            {
                if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                    return BadRequest("Neispravan kursor");
                if (!await Context.Korisnici.AnyAsync(k => k.Id == korisnik_Id))
                    return NotFound();

                var upit = Context.Dogadjaji.Include(d => d.KreatorId).Where(d => d.ID_Kreatora == korisnik_Id);
                return Ok(await Paginacija.UzmiAsync(upit, posle, limit));
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspelo vracanje dogadjaja korisnika: " + ex.Message);
            }
        }

        // Notifikacije ulogovanog korisnika, najnovije prve (vidi NotifikacijaDto)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiNotifikacijeKorisnika/{korisnik_Id}")]
        public async Task<ActionResult> VratiNotifikacijeKorisnika(int korisnik_Id, [FromQuery] int limit = 50)
        {
            if (korisnik_Id != User.IdKorisnika())
                return Forbid(); // svoje notifikacije
            var notifikacije = await Context.Notifikacije
                .Where(n => n.KorisnikCijaJeObjavaId == korisnik_Id)
                .OrderByDescending(n => n.Vreme).ThenByDescending(n => n.Id)
                .Take(Math.Clamp(limit, 1, 100))
                .Select(NotifikacijaDto.Projekcija)
                .ToListAsync();
            return Ok(notifikacije);
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiPetNotifikacijaKorisnika/{korisnik_Id}")]
        public Task<ActionResult> VratiPetNotifikacijaKorisnika(int korisnik_Id)
            => VratiNotifikacijeKorisnika(korisnik_Id, 5);

        [HttpPut]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
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

        // Odjava: token prestaje da vazi odmah, a ne tek kad istekne sesija (do 30 min).
        // Token se zameni novim nasumicnim koji niko nema (kolona je obavezna i jedinstvena),
        // pa stari vise ne pronalazi nijednog korisnika -> svaki sledeci zahtev sa njim je 401.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("Odjava")]
        public async Task<ActionResult> Odjava()
        {
            var k = await Context.Korisnici.FindAsync(User.IdKorisnika());
            if (k == null)
                return Forbid(); // administrator se odjavljuje preko /Administrator/Odjava
            k.Token = NoviToken();
            k.Validnost = DateTime.Now;
            await Context.SaveChangesAsync();
            return Ok("Odjavljeni ste");
        }

        private ObjectResult Zakljucano(TimeSpan preostalo)
        {
            Response.Headers.RetryAfter = ((int)Math.Ceiling(preostalo.TotalSeconds)).ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = ZastitaPrijave.Poruka(preostalo) });
        }

        // Nasumican token od 256 bita (64 hex znaka)
        private static string NoviToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();

        [HttpGet]
        [EnableCors("CORS")]
        [AllowAnonymous]
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
