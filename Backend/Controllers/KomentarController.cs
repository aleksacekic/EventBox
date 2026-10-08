using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    // Komentar kako ga vidi klijent (ime i slika autora citaju se preko veze, uvek aktuelni)
    public class KomentarDto
    {
        public int Id { get; set; }
        public string Tekst { get; set; }
        public int AutorId { get; set; }
        public string Username_korisnika { get; set; }
        public string? SlikaKorisnika { get; set; }
        public DateTime Vreme { get; set; } // UTC

        public static KomentarDto Od(Komentar k) => new KomentarDto
        {
            Id = k.Id, Tekst = k.Tekst, AutorId = k.AutorId,
            Username_korisnika = k.Autor.Korisnicko_Ime, SlikaKorisnika = k.Autor.KorisnikImage, Vreme = k.Vreme
        };
    }

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
            // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
            if(korisnik_Id != User.IdKorisnika())
                return Forbid(); // komentarise samo u svoje ime
            string tekst = zahtev?.Tekst?.Trim() ?? "";
            if (ProveriTekst(tekst) is string greska)
                return BadRequest(greska);

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

            await Context.Entry(k).Reference(x => x.Autor).LoadAsync();
            return Ok(KomentarDto.Od(k)); // klijent ga dodaje u listu bez ponovnog ucitavanja
        }

        [HttpPut]
        [EnableCors("CORS")]
        [Route("IzmeniKomentar")]
        public async Task<ActionResult> IzmeniKomentar (int id, [FromBody] KomentarZahtev zahtev)
        {
            string novTekst = zahtev?.Tekst?.Trim() ?? "";
            if (ProveriTekst(novTekst) is string greska)
                return BadRequest(greska);

            Komentar k = await Context.Komentari.FindAsync(id);
            if(k == null)
                return NotFound();
            if(k.AutorId != User.IdKorisnika())
                return Forbid(); // menja samo autor
            k.Tekst = novTekst;

            Context.Komentari.Update(k);
            await Context.SaveChangesAsync();
            await _obavestenja.IzmeniZaKomentarAsync(k);
            await Context.Entry(k).Reference(x => x.Autor).LoadAsync();
            return Ok(KomentarDto.Od(k));
        }

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiKomentar/{id}")]
        public async Task<ActionResult> IzbrisiKomentar(int id)
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

        // Komentari dogadjaja, najnoviji prvi, stranicenje kursorom (Models/Paginacija.cs):
        //   ?limit=10                 -> najnovijih 10 (+ ukupno)
        //   ?limit=10&cursor=<kursor> -> sledecih 10 starijih
        // Odgovor: { stavke: [KomentarDto], sledeciKursor, imaJos, ukupno }
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKomentare/{id_dogadjaja}")]
        public async Task<ActionResult> VratiKomentare(int id_dogadjaja, [FromQuery] int limit = 10, [FromQuery] string? cursor = null)
        {
            if (!Paginacija.TryDekodiraj(cursor, out int? posle))
                return BadRequest("Neispravan kursor");
            var upit = Context.Komentari.Include(q => q.Autor).Where(q => q.Dogadjaj_Id.Id == id_dogadjaja);
            var strana = await Paginacija.UzmiAsync(upit, posle, limit);
            return Ok(new
            {
                stavke = strana.Stavke.Select(KomentarDto.Od),
                strana.SledeciKursor,
                strana.ImaJos,
                strana.Ukupno
            });
        }

        private static string? ProveriTekst(string tekst)
            => tekst.Length == 0 ? "Komentar ne sme biti prazan"
             : tekst.Length > 1000 ? "Komentar moze imati najvise 1000 karaktera"
             : null;

        [HttpDelete]
        [EnableCors("CORS")]
        [Route("IzbrisiKomentareDogadjaja/{dogadjaj_ID}")]
        public async Task<ActionResult> IzbrisiKomentareDogadjaja(int dogadjaj_ID)
        {
            Dogadjaj d = await Context.Dogadjaji.Where(p => p.Id == dogadjaj_ID).Include(p => p.Lista_Komentara).FirstOrDefaultAsync();
            if(d == null)
                return NotFound();
            if(d.ID_Kreatora != User.IdKorisnika())
                return Forbid();

            // Notifikacije ovih komentara se brisu u istom SaveChanges (FK bez kaskade, vidi EventBoxContext)
            Context.Notifikacije.RemoveRange(Context.Notifikacije.Where(n => n.KomentarId != null && n.DogadjajId == dogadjaj_ID));
            Context.Komentari.RemoveRange(d.Lista_Komentara);
            await Context.SaveChangesAsync();
            return Ok("Uspesno su obrisani komentari dogadjaja");
        }
    }
}