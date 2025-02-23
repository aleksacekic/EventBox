// using System.Linq;
// using Microsoft.AspNetCore.Cors;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using Models;

// namespace EventBoxApi.Controllers
// {
//     [ApiController]
//     [Route("[controller]")]
//     public class ChatController : ControllerBase 
//     {
//         public EventBoxContext Context;
//         public ChatController(EventBoxContext context)
//         {
//             this.Context = context;
//         }

//         [HttpPost]
//         [Route("KreirajChat/{id_prvog_korisnika}/{id_drugog_korisnika}")]
//         [EnableCors("CORS")]
//         public async Task<ActionResult> KreirajChat(int id_prvog_korisnika, int id_drugog_korisnika)
//         {
//             try
//             {
//                 Chat c = new Chat();
//                 c.PrviKorisnikId = id_prvog_korisnika;
//                 c.DrugiKorisnikId = id_drugog_korisnika;
//                 Context.Chatovi.Add(c);
//                 await Context.SaveChangesAsync();
//                 return Ok(c);
//             }
//             catch(Exception ex)
//             {
//                 return BadRequest("Nije uspesno kreiran chat "+ex.Message);
//             }

//         }

//         [HttpGet]
//         [Route("VratiChat/{id_prvog_korisnika}/{id_drugog_korisnika}")]
//         [EnableCors("CORS")]
//         public async Task<ActionResult> VratiChat(int id_prvog_korisnika, int id_drugog_korisnika)
//         {
//             try
//             {
//                 Chat c = await Context.Chatovi.Where(p => (p.PrviKorisnikId == id_prvog_korisnika && p.DrugiKorisnikId == id_drugog_korisnika) || 
//                                                           (p.PrviKorisnikId == id_drugog_korisnika && p.DrugiKorisnikId == id_prvog_korisnika)).FirstAsync();
                
//                 if(c == null)
//                     return Ok(new {none = "NONE"});
                
//                 //c.Lista_Poruka.

//                 return Ok(c);
//             }
//             catch(Exception ex)
//             {
//                 return BadRequest("Nije uspesno vracen chat "+ex.Message);
//             }
//         }
//     }
// }