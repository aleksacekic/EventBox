using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    public class KomentarZahtev
    {
        public string Tekst { get; set; }
    }

    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class KomentarController : ControllerBase
    {
        public EventBoxContext Context;
        private readonly Obavestenja _obavestenja;
        public KomentarController(EventBoxContext context, Obavestenja obavestenja)
        {
            this.Context = context;
            _obavestenja = obavestenja;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("PostaviKomentar/{korisnik_Id}/{dogadjaj_Id}")]
        public async Task<ActionResult> PostaviKomentar(int korisnik_Id, int dogadjaj_Id, [FromBody] KomentarZahtev zahtev)
        {
            try
            {
                // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
                if(korisnik_Id != User.IdKorisnika())
                    return Forbid(); // komentarise samo u svoje ime
                string tekst = zahtev?.Tekst;
                if(string.IsNullOrWhiteSpace(tekst))
                    return BadRequest("Komentar ne sme biti prazan");

                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                if(d == null)
                    return NotFound();
                Komentar k = new Komentar();
                k.Tekst = tekst;
                k.AutorId = korisnik_Id;
                k.Vreme = DateTime.UtcNow;
                k.Dogadjaj_Id = d;

                Context.Komentari.Add(k);
                await Context.SaveChangesAsync();

                await _obavestenja.NotifikujVlasnikaAsync(d, korisnik_Id, TipNotifikacije.Komentar, tekst, komentarId: k.Id);

                return Ok("Uspesno je napravljen novi komentar");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno ubacen novi komentar! " + ex.Message
                    + (ex.InnerException != null ? " | INNER: " + ex.InnerException.Message : ""));
            }
        }

        [HttpPut]
        [EnableCors("CORS")]
        [Route("IzmeniKomentar")]
        public async Task<ActionResult> IzmeniKomentar (int id, [FromBody] KomentarZahtev zahtev)
        {
            try
            {
                if(string.IsNullOrWhiteSpace(zahtev?.Tekst))
                    return BadRequest("Komentar ne sme biti prazan");

                Komentar k = await Context.Komentari.FindAsync(id);
                if(k == null)
                    return NotFound();
                if(k.AutorId != User.IdKorisnika())
                    return Forbid(); // menja samo autor
                k.Tekst = zahtev.Tekst;

                Context.Komentari.Update(k);
                await Context.SaveChangesAsync();
                await _obavestenja.IzmeniZaKomentarAsync(k);
                return Ok("Uspesno je promenjen komentar sa ID-em "+id);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izmenjen komentar "+ ex.Message);
            }
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiKomentar/{id}")]
        public async Task<ActionResult> IzbrisiKomentar(int id)
        {
            try
            {
                Komentar k = await Context.Komentari.FindAsync(id);
                if(k == null)
                    return NotFound();
                if(k.AutorId != User.IdKorisnika())
                    return Forbid(); // brise samo autor
                // Zajedno sa komentarom nestaje i notifikacija koju je napravio
                var uklonjene = await _obavestenja.UkloniAsync(Context.Notifikacije.Where(n => n.KomentarId == id));
                Context.Komentari.Remove(k);
                await Context.SaveChangesAsync();
                await _obavestenja.JaviUklonjeneAsync(uklonjene);
                return Ok("Uspesno je izbrisan komentar sa ID-em: "+id);
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno izbrisan korisnik " + ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKomentare/{id_dogadjaja}")]
        public async Task<ActionResult> VratiKomentare(int id_dogadjaja)
        {
            try
            {
                // Ime i slika autora se citaju preko veze (uvek aktuelni), redosled po vremenu
                var komentari = await Context.Komentari
                    .Where(q => q.Dogadjaj_Id.Id == id_dogadjaja)
                    .OrderBy(q => q.Vreme).ThenBy(q => q.Id)
                    .Select(q => new
                    {
                        Id = q.Id,
                        Tekst = q.Tekst,
                        AutorId = q.AutorId,
                        Username_korisnika = q.Autor.Korisnicko_Ime,
                        SlikaKorisnika = q.Autor.KorisnikImage,
                        Vreme = q.Vreme
                    })
                    .ToListAsync();

                // Isti oblik odgovora kao ranije: [{ komentari: [...] }]
                return Ok(new[] { new { komentari } });

            }
            catch(Exception ex)
            {
                return BadRequest("Komentari dogadjaja nisu uspesno vraceni" + ex.Message);
            }
        }
        
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiKomentareDogadjaja/{dogadjaj_ID}")]
        public async Task<ActionResult> IzbrisiKomentareDogadjaja(int dogadjaj_ID)
        {
            try
            {
                Dogadjaj d = await Context.Dogadjaji.Where(p => p.Id == dogadjaj_ID).Include(p => p.Lista_Komentara).FirstOrDefaultAsync();
                if(d == null)
                    return NotFound();
                if(d.ID_Kreatora != User.IdKorisnika())
                    return Forbid();

                if(d.Lista_Komentara.Count() > 0)
                {
                    d.Lista_Komentara.ForEach(p => {
                        Context.Komentari.Remove(p);
                    });
                }
                await Context.SaveChangesAsync();
                return Ok("Uspesno su obrisani komentari dogadjaja");
            }
            catch(Exception ex)
            {
                return BadRequest("Nisu uspesno obrisani komentari dogadjaja "+ex.Message);
            }
        }
    }
}