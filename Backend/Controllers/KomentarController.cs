using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.SignalR;

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
        private readonly IHubContext<NotificationHub> _hubContext;
        public KomentarController(EventBoxContext context, IHubContext<NotificationHub> hubContext)
        {
            this.Context = context;
            _hubContext = hubContext;
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

                Korisnik kor = await Context.Korisnici.FindAsync(korisnik_Id);
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                Komentar k = new Komentar();
                k.Tekst = tekst;
                k.Username_Korisnika = kor.Korisnicko_Ime;
                k.Dogadjaj_Id = d;
                k.SlikaKorisnika = kor.KorisnikImage ?? "";   // kolona je NOT NULL, korisnik bez profilne ima null

                Context.Komentari.Add(k);
                await Context.SaveChangesAsync();

                //Console.WriteLine($"Pokušaj slanja notifikacije korisniku {d.ID_Kreatora} za događaj {dogadjaj_Id}");
                //if(d.ID_Kreatora != korisnik_Id)
                //{
                    Console.WriteLine($"Slanje notifikacije korisniku {d.ID_Kreatora}");
                    await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveNewComment", tekst, dogadjaj_Id, korisnik_Id);
                     
                //}
               

                //Console.WriteLine("Poziv ka hubu je izvršen.");


       

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
                if(k.Username_Korisnika != User.Identity!.Name)
                    return Forbid(); // menja samo autor
                k.Tekst = zahtev.Tekst;

                Context.Komentari.Update(k);
                await Context.SaveChangesAsync();
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
                if(k.Username_Korisnika != User.Identity!.Name)
                    return Forbid(); // brise samo autor
                Context.Komentari.Remove(k);
                await Context.SaveChangesAsync();
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
                var komentari = Context.Dogadjaji
                                .Where(p => p.Id == id_dogadjaja)
                                .Include(p => p.Lista_Komentara);

                var komentar = await komentari.ToListAsync();
                return Ok(komentar.Select(p => new {
                    komentari = p.Lista_Komentara.Select(q => new 
                    {
                        Id = q.Id,
                        Tekst = q.Tekst,
                        Username_korisnika = q.Username_Korisnika,
                        SlikaKorisnika = q.SlikaKorisnika

                    }).ToList()
                })); 

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