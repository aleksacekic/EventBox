using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace EventBoxApi.Controllers
{
    public class PorukaZahtev
    {
        public string Poruka { get; set; }
    }

    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class PorukaController : ControllerBase
    {
        public EventBoxContext Context;
        public PorukaController(EventBoxContext context)
        {
            this.Context = context;
        }

        [HttpPost]
        [EnableCors("CORS")]
        [Route("PosaljiPoruku/{primaoc_id}/{posiljaoc_id}")]
        public async Task<IActionResult> PosaljiPoruku(int primaoc_id, int posiljaoc_id, [FromBody] PorukaZahtev zahtev)
        {
            try
            {
                if (posiljaoc_id != User.IdKorisnika())
                    return Forbid(); // salje samo u svoje ime

                // Tekst ide u telu zahteva, ne u URL-u - inace znaci poput / ? # kvare rutu
                if (string.IsNullOrWhiteSpace(zahtev?.Poruka))
                    return BadRequest("Poruka ne sme biti prazna");
                if (zahtev.Poruka.Length > 1000)
                    return BadRequest("Poruka moze imati najvise 1000 karaktera");
                if (primaoc_id == posiljaoc_id)
                    return BadRequest("Ne moze se slati poruka samom sebi");
                if (!await Context.Korisnici.AnyAsync(k => k.Id == primaoc_id))
                    return NotFound("Primalac ne postoji");

                Poruka p = new Poruka
                {
                    PrimaocId = primaoc_id,
                    JelProcitano = false,
                    PosiljaocId = posiljaoc_id,
                    Sadrzaj = zahtev.Poruka,
                    Vreme = DateTime.UtcNow
                };
                Context.Poruke.Add(p);
                await Context.SaveChangesAsync();
                return Ok("Uspesno kreirana poruka");
            }
            catch (Exception ex)
            {
                return BadRequest("Nije uspesno kreirana poruka " + ex.Message);
            }
        }

        // [HttpGet]
        // [EnableCors("CORS")]
        // [Route("VratiPoruke/{user1}/{user2}")]
        // public async Task<IActionResult> VratiPoruke(int user1, int user2)
        // {
        //     try
        //     {

        //         var poruke = await Context.Poruke
        //         .Where(m => (m.PosiljaocId == user1 && m.PrimaocId == user2) ||
        //                 (m.PosiljaocId == user2 && m.PrimaocId == user1))
        //     .   OrderBy(m => m.Vreme)
        //         .ToListAsync();
        //         return Ok(poruke);
        //     }
        //     catch (Exception ex)
        //     {
        //         return BadRequest("Nije uspesno vracen spisak poruka " + ex.Message);
        //     }
        // }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiPoruke/{user1}/{user2}")]
        public async Task<IActionResult> VratiPoruke(int user1, int user2, int page = 0, int size = 20)
        {
            try
            {
                if (user1 != User.IdKorisnika() && user2 != User.IdKorisnika())
                    return Forbid(); // samo ucesnici razgovora

                if (page < 0 || size <= 0)
                    return BadRequest("Neispravni parametri paginacije.");

                var poruke = await Context.Poruke
                    .Where(m => (m.PosiljaocId == user1 && m.PrimaocId == user2) ||
                                (m.PosiljaocId == user2 && m.PrimaocId == user1))
                    .OrderByDescending(m => m.Vreme) // Najnovije poruke prve
                    .Skip(page * size)  // Preskoči prethodne stranice
                    .Take(size)         // Uzmi sledećih `size` poruka
                    .ToListAsync();

                return Ok(poruke);
            }
            catch (Exception ex)
            {
                return BadRequest("Greška pri vraćanju poruka: " + ex.Message);
            }
        }




        [HttpPut]
        [EnableCors("CORS")]
        [Route("OznaciKaoProcitano/{senderId}/{receiverId}")]
        public async Task<IActionResult> OznaciKaoProcitano(int senderId, int receiverId)
        {
            try
            {
                if (receiverId != User.IdKorisnika())
                    return Forbid();
                var neprocitanePoruke = await Context.Poruke
                    .Where(m => m.PosiljaocId == senderId && m.PrimaocId == receiverId && !m.JelProcitano)
                    .ToListAsync();
                foreach (var poruka in neprocitanePoruke)
                {
                    poruka.JelProcitano = true;
                }
                await Context.SaveChangesAsync();

                return Ok("Poruke oznacene kao procitane");
            }
            catch (Exception ex)
            {
                return BadRequest("Greska pri oznacavanju poruka kao procitane " + ex.Message);
            }
        }

        [HttpGet]
        [EnableCors("CORS")]
        [Route("KolikoNeprocitanihPoruka/{userId}")]
        public async Task<IActionResult> KolikoNeprocitanihPoruka(int userId)
        {
            try
            {
                if (userId != User.IdKorisnika())
                    return Forbid();
                var brojPoruka = await Context.Poruke
                 .Where(m => m.PrimaocId == userId && !m.JelProcitano)
                 .CountAsync();

                return Ok(brojPoruka);
            }
            catch (Exception ex)
            {
                return BadRequest("Greška pri vraćanju poruka: " + ex.Message);
            }

        }


        //dohvatanje korisnika sa kojima je korisnik komunicirao
        [HttpGet]
        [EnableCors("CORS")]
        [Route("VratiKorisnikeSaMogChata/{userId}")]
        public async Task<IActionResult> VratiKorisnikeSaMogChata(int userId)
        {
            if (userId != User.IdKorisnika())
                return Forbid();

            var users = await Context.Poruke
                .Where(m => m.PosiljaocId == userId || m.PrimaocId == userId)
                .Select(m => m.PosiljaocId == userId ? m.PrimaocId : m.PosiljaocId)
                .Distinct()
                .ToListAsync();

            return Ok(users);
        }



        [HttpDelete]
        [EnableCors("CORS")]
        [Route("ObrisiPoruku/{poruka_id}")]
        public async Task<IActionResult> ObrisiPoruku(int poruka_id)
        {
            try
            {
                var poruka = await Context.Poruke.FindAsync(poruka_id);
                if (poruka == null)
                {
                    return NotFound("Poruka nije pronadjena");
                }
                if (poruka.PosiljaocId != User.IdKorisnika())
                    return Forbid(); // brise samo posiljalac
                Context.Poruke.Remove(poruka);
                await Context.SaveChangesAsync();
                return Ok("Poruka uspesno obrisana");
            }
            catch (Exception ex)
            {
                return BadRequest("Greska pri brisanju poruke " + ex.Message);
            }
        }


    }
}