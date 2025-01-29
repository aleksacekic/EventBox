using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Microsoft.AspNetCore.SignalR;

namespace EventBoxApi.Controllers
{
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
        [Route("PostaviKomentar/{tekst}/{korisnik_Id}/{dogadjaj_Id}")]
        public async Task<ActionResult> PostaviKomentar(string tekst, int korisnik_Id, int dogadjaj_Id)
        {
            try
            {
		await Validnost.Validiraj(Context, Request);
                Korisnik kor = await Context.Korisnici.FindAsync(korisnik_Id);
                Dogadjaj d = await Context.Dogadjaji.FindAsync(dogadjaj_Id);
                Komentar k = new Komentar();
                k.Tekst = tekst;
                k.Username_Korisnika = kor.Korisnicko_Ime;
                k.Dogadjaj_Id = d;
                k.SlikaKorisnika = kor.KorisnikImage;

                Context.Komentari.Add(k);
                await Context.SaveChangesAsync();

                //Console.WriteLine($"Pokušaj slanja notifikacije korisniku {d.ID_Kreatora} za događaj {dogadjaj_Id}");
                if(d.ID_Kreatora != korisnik_Id)
                {
                     await _hubContext.Clients.User(d.ID_Kreatora.ToString()).SendAsync("ReceiveNewComment", tekst, dogadjaj_Id);
                }
               

                //Console.WriteLine("Poziv ka hubu je izvršen.");


       

                return Ok("Uspesno je napravljen novi komentar");
            }
            catch(Exception ex)
            {
                return BadRequest("Nije uspesno ubacen novi komentar! "+ex.Message);
            }
        }

        [HttpPut]
        [EnableCors("CORS")]
        [Route("IzmeniKomentar")]
        public async Task<ActionResult> IzmeniKomentar (int id, string tekst)
        {
            try
            {
                Komentar k = await Context.Komentari.FindAsync(id);
                k.Tekst = tekst;

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