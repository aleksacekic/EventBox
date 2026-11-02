using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Models;
using EventBoxApi.Repo.Abstract;
using EventBoxApi.Repo.Implementation;
using System.Security.Cryptography;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    // Korisnici: registracija, prijava i odjava, profil, profilna slika, a za administratora
    // blokiranje i pregled korisnika. Sve rute pocinju sa /api/users.
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        public EventBoxContext Context { get; set; }
        public IFileService _fileService;
        private readonly NotificationService _notifications;
        private readonly LoginProtection _loginProtection;
        private readonly IStringLocalizer<SharedResource> _t;

        public UsersController(EventBoxContext context, IFileService fs, NotificationService notifications, LoginProtection loginProtection, IStringLocalizer<SharedResource> t)
        {
            Context = context;
            this._fileService = fs;
            _notifications = notifications;
            _loginProtection = loginProtection;
            _t = t;
        }

        // POST /api/users - registracija novog korisnika.
        // Zauzeto ime/email ili neispravan datum: 200 { error: USERNAME_TAKEN | EMAIL_TAKEN | INVALID_BIRTH_DATE }
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(LoginProtection.RegistrationPolicy)]
        [HttpPost]
        public async Task<ActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName)
                || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Email)
                || string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
                return BadRequest(T("AllFieldsRequired"));

            request.Username = UsernameRules.Normalize(request.Username);
            var usernameError = UsernameRules.Validate(request.Username, _t);
            if (usernameError != null)
                return BadRequest(usernameError);

            request.Email = EmailRules.Normalize(request.Email);
            if (EmailRules.Validate(request.Email, _t) is string emailError)
                return BadRequest(emailError);

            // Datum rodjenja mora biti izmedju 1900. i danas
            if (request.DateOfBirth < new DateTime(1900, 1, 1) || request.DateOfBirth > DateTime.Today)
                return Ok(new { error = "INVALID_BIRTH_DATE" });

            if (await Context.Users.AnyAsync(u => u.Username == request.Username))
                return Ok(new { error = "USERNAME_TAKEN" });
            if (await Context.Users.AnyAsync(u => u.Email == request.Email))
                return Ok(new { error = "EMAIL_TAKEN" });

            var user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Username = request.Username,
                PasswordHash = Passwords.Hash(request.Password),
                Token = GenerateToken(),
                TokenExpiresAt = DateTime.UtcNow.AddMinutes(10),
                DateOfBirth = request.DateOfBirth,
                Email = request.Email,
                ProfileImage = null,
                IsBlocked = false,
            };

            Context.Users.Add(user);
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (EmailRules.IsDuplicate(e))
            {
                return Ok(new { error = "EMAIL_TAKEN" });
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                // Neko je isto ime zauzeo izmedju provere gore i upisa
                return Ok(new { error = "USERNAME_TAKEN" });
            }
            return Ok(T("UserRegistered", request.Username));
        }

        // POST /api/users/login
        // Odgovor: { token, userId } ili { error: INVALID_CREDENTIALS | ACCOUNT_BLOCKED }
        [HttpPost]
        [EnableCors("CORS")]
        [AllowAnonymous]
        [EnableRateLimiting(LoginProtection.LoginPolicy)]
        [Route("login")]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
                return Ok(new { error = "INVALID_CREDENTIALS" });

            string username = UsernameRules.Normalize(request.Username);

            // Zakljucano ime (previse pogresnih lozinki) se odbija pre provere lozinke
            if (_loginProtection.GetRemainingLockout("k", username) is TimeSpan remaining)
                return LockedOut(remaining);

            var user = await Context.Users.FirstOrDefaultAsync(u => u.Username == username);

            // Isti odgovor za nepostojeceg korisnika i pogresnu lozinku; broji se i nepostojece
            // ime, da se iz zakljucavanja ne bi videlo koja imena postoje
            if (user == null || !Passwords.Verify(user.PasswordHash, request.Password, out bool needsRehash))
            {
                _loginProtection.RecordFailure("k", username);
                return Ok(new { error = "INVALID_CREDENTIALS" });
            }
            _loginProtection.RecordSuccess("k", username);
            if (user.IsBlocked)
                return Ok(new { error = "ACCOUNT_BLOCKED" });

            // Heš sa slabijim podesavanjima (npr. manje iteracija) se pri prijavi osvezava
            if (needsRehash)
                user.PasswordHash = Passwords.Hash(request.Password);

            user.Token = GenerateToken();
            user.TokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
            await Context.SaveChangesAsync();

            return Ok(new { token = user.Token, userId = user.Id });
        }

        // POST /api/users/logout
        // Odjava: token prestaje da vazi odmah, a ne tek kad istekne sesija (do 30 min).
        // Token se zameni novim nasumicnim koji niko nema (kolona je obavezna i jedinstvena),
        // pa stari vise ne pronalazi nijednog korisnika -> svaki sledeci zahtev sa njim je 401.
        [HttpPost]
        [EnableCors("CORS")]
        [Route("logout")]
        public async Task<ActionResult> Logout()
        {
            var user = await Context.Users.FindAsync(User.GetUserId());
            if (user == null)
                return Forbid(); // administrator se odjavljuje preko /api/admins/logout
            user.Token = GenerateToken();
            user.TokenExpiresAt = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok(T("LoggedOut"));
        }

        // GET /api/users - svi korisnici osim ulogovanog (lista za novi razgovor u cetu), samo javna polja
        [EnableCors("CORS")]
        [HttpGet]
        public async Task<ActionResult> GetUsers()
        {
            int currentId = User.GetUserId();
            bool admin = User.IsAdmin();
            var users = await Context.Users
                .Where(u => u.Id != currentId && (admin || !u.IsBlocked)) // blokirani se ne nude
                .Select(UserDto.Projection)
                .ToListAsync();

            return Ok(users);
        }

        // GET /api/users/search?query=ana - do 6 korisnika po imenu, prezimenu ili korisnickom imenu.
        // Dve reci se traze kao ime + prezime (u bilo kom redosledu). Nema rezultata -> [].
        [HttpGet]
        [EnableCors("CORS")]
        [Route("search")]
        public async Task<ActionResult> SearchUsers([FromQuery] string? query)
        {
            string[] words = (query ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (words.Length == 0)
                return Ok(Array.Empty<object>());

            // Blokirani korisnici se ne pronalaze - osim kad trazi administrator
            IQueryable<User> source = User.IsAdmin() ? Context.Users : Context.Users.Where(u => !u.IsBlocked);

            List<User> found;
            if (words.Length == 1)
            {
                string w = words[0];
                found = await source.Where(u => u.FirstName.Contains(w) || u.LastName.Contains(w) || u.Username.Contains(w))
                    .Take(6).ToListAsync();
            }
            else
            {
                found = await source.Where(u => u.FirstName.Contains(words[0]) && u.LastName.Contains(words[1])).Take(6).ToListAsync();
                if (found.Count == 0)
                    found = await source.Where(u => u.FirstName.Contains(words[1]) && u.LastName.Contains(words[0])).Take(6).ToListAsync();
            }

            return Ok(found.Select(u => new { u.Id, u.Username, u.FirstName, u.LastName }));
        }

        // GET /api/users/{id} - javni podaci korisnika (bez njegovih dogadjaja)
        [EnableCors("CORS")]
        [Route("{id:int}")]
        [HttpGet]
        public async Task<ActionResult> GetUser(int id)
        {
            // Samo javna polja - bez lozinke, heša i tokena (vidi UserDto)
            var user = await Context.Users
                .Where(u => u.Id == id)
                .Select(UserDto.Projection)
                .FirstOrDefaultAsync();
            if (user == null)
                return NotFound(T("UserNotFound", id));
            return Ok(user);
        }

        // PUT /api/users/me - izmena podataka ulogovanog korisnika.
        // Neispravan unos -> 400 { message, errors: { polje: poruka } }
        // (polja: firstName, lastName, username, email, dateOfBirth, password, currentPassword).
        // Nova lozinka trazi i trenutnu. Uspeh -> javni podaci korisnika (UserDto).
        [EnableCors("CORS")]
        [Route("me")]
        [HttpPut]
        public async Task<ActionResult> UpdateCurrentUser([FromBody] UpdateUserRequest request)
        {
            var user = await Context.Users.FindAsync(User.GetUserId());
            if (user == null)
                return Forbid(); // administrator nema korisnicki profil
            if (request == null)
                return BadRequest(T("MissingData"));

            var errors = new Dictionary<string, string>();
            request.FirstName = request.FirstName?.Trim() ?? "";
            request.LastName = request.LastName?.Trim() ?? "";
            request.Email = EmailRules.Normalize(request.Email);
            if (request.FirstName.Length is < 1 or > 50) errors["firstName"] = T("FirstNameLength");
            if (request.LastName.Length is < 1 or > 50) errors["lastName"] = T("LastNameLength");
            request.Username = UsernameRules.Normalize(request.Username);
            if (UsernameRules.Validate(request.Username, _t) is string usernameError) errors["username"] = usernameError;
            if (EmailRules.Validate(request.Email, _t) is string emailError)
                errors["email"] = emailError;
            if (request.DateOfBirth < new DateTime(1900, 1, 1) || request.DateOfBirth > DateTime.Today)
                errors["dateOfBirth"] = T("InvalidBirthDate");
            if (!string.IsNullOrEmpty(request.Password) && request.Password.Length < 8)
                errors["password"] = T("NewPasswordLength");
            if (errors.Count > 0)
                return BadRequest(new { message = T("CheckInput"), errors });

            if (!string.IsNullOrEmpty(request.Password))
            {
                var passwordError = VerifyPassword(user, request.CurrentPassword, "currentPassword");
                if (passwordError != null)
                    return passwordError;
                user.PasswordHash = Passwords.Hash(request.Password);
            }

            if (user.Username != request.Username &&
                await Context.Users.AnyAsync(u => u.Username == request.Username))
                return UsernameTaken();
            if (await Context.Users.AnyAsync(u => u.Id != user.Id && u.Email == request.Email))
                return EmailTaken();

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Username = request.Username;
            user.DateOfBirth = request.DateOfBirth.Date;
            user.Email = request.Email;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch (DbUpdateException e) when (EmailRules.IsDuplicate(e))
            {
                return EmailTaken();
            }
            catch (DbUpdateException e) when (UsernameRules.IsDuplicate(e))
            {
                return UsernameTaken();
            }
            return Ok(await Context.Users.Where(u => u.Id == user.Id).Select(UserDto.Projection).FirstAsync());
        }

        // DELETE /api/users/{id} - brisanje sopstvenog naloga (trazi lozinku u telu zahteva)
        [EnableCors("CORS")]
        [Route("{id:int}")]
        [HttpDelete]
        public async Task<ActionResult> DeleteUser(int id, [FromBody] DeleteAccountRequest? request)
        {
            if (id != User.GetUserId())
                return Forbid(); // nalog brise samo njegov vlasnik
            var user = await Context.Users.FindAsync(id);
            if (user == null)
                return NotFound();
            // Nepovratno - trazi se i lozinka, ne samo token (npr. otkljucan tudji racunar)
            var passwordError = VerifyPassword(user, request?.Password, "password");
            if (passwordError != null)
                return passwordError;
            // Slike na disku: profilna i slike njegovih dogadjaja (brisu se posle uspesnog brisanja iz baze)
            var images = await Context.Events.Where(e => e.CreatorId == id && e.Image != null)
                .Select(e => e.Image).ToListAsync();
            images.Add(user.ProfileImage);
            // Komentari na tudjim dogadjajima nemaju kaskadu u bazi (vidi EventBoxContext);
            // oni na sopstvenim dogadjajima se brisu kaskadno zajedno sa dogadjajima
            Context.Comments.RemoveRange(Context.Comments.Where(c => c.AuthorId == id));
            // Isto za reakcije; posle brisanja se brojaci tih tudjih dogadjaja ponovo racunaju
            var reactedTo = await Context.Reactions
                .Where(r => r.UserId == id && r.Event.CreatorId != id)
                .Select(r => r.EventId)
                .ToArrayAsync();
            Context.Reactions.RemoveRange(Context.Reactions.Where(r => r.UserId == id));
            // Njegove prijave ostaju (moderaciji treba razlog), samo gube podatak ko je prijavio
            foreach (var reason in await Context.ReportReasons.Where(r => r.ReporterId == id).ToListAsync())
                reason.ReporterId = null;
            // Poruke (poslate i primljene) i notifikacije koje je izazvao na tudjim objavama
            Context.Messages.RemoveRange(Context.Messages.Where(m => m.SenderId == id || m.RecipientId == id));
            var removed = await _notifications.RemoveAsync(Context.Notifications.Where(n => n.ActorId == id));
            Context.Users.Remove(user);
            await Context.SaveChangesAsync();
            await ReactionCounters.RefreshAsync(Context, reactedTo);
            await _notifications.NotifyRemovedAsync(removed); // primaocima tih notifikacija nestaju uzivo
            images.ForEach(_fileService.DeleteImage);
            return Ok(T("UserDeleted", id));
        }

        // PUT /api/users/{id}/image - postavlja ili menja profilnu sliku (multipart, polje "file").
        // Odgovor: { image }. Neispravan fajl -> 400 { message }. Stara slika se brise sa diska.
        [HttpPut]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        [RequestSizeLimit(FileService.MaxFileSize + 64 * 1024)]
        public async Task<ActionResult> UploadProfileImage(int id, IFormFile? file)
        {
            if (id != User.GetUserId())
                return Forbid();
            var user = await Context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            var result = await _fileService.SaveImageAsync(file);
            if (result.Error != null)
                return BadRequest(new { message = result.Error });

            string? oldImage = user.ProfileImage;
            user.ProfileImage = result.FileName;
            try
            {
                await Context.SaveChangesAsync();
            }
            catch
            {
                _fileService.DeleteImage(result.FileName);
                throw;
            }
            _fileService.DeleteImage(oldImage);
            return Ok(new { image = user.ProfileImage });
        }

        // DELETE /api/users/{id}/image - uklanja profilnu sliku
        [HttpDelete]
        [EnableCors("CORS")]
        [Route("{id:int}/image")]
        public async Task<ActionResult> DeleteProfileImage(int id)
        {
            if (id != User.GetUserId())
                return Forbid();
            var user = await Context.Users.FindAsync(id);
            if (user == null)
                return BadRequest(T("UserNotFound", id));

            // Fajl moze vec da fali na disku - referenca u bazi se svakako cisti
            string? oldImage = user.ProfileImage;
            user.ProfileImage = null;
            await Context.SaveChangesAsync();
            _fileService.DeleteImage(oldImage);
            return Ok(T("ImageDeleted"));
        }

        // GET /api/users/{id}/categories - koliko dogadjaja korisnik ima po kategoriji
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}/categories")]
        public async Task<ActionResult> GetUserCategories(int id)
        {
            var categories = await Context.Events
                .Where(e => e.CreatorId == id)
                .GroupBy(e => e.Category)
                .Select(g => new { Category = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ThenBy(x => x.Category)
                .ToListAsync();

            return Ok(categories);
        }

        // GET /api/users/{id}/events - dogadjaji korisnika za profil: najnoviji prvi,
        // stranicenje kursorom (vidi EventsController)
        [HttpGet]
        [EnableCors("CORS")]
        [Route("{id:int}/events")]
        public async Task<ActionResult> GetUserEvents(int id, [FromQuery] int limit = Pagination.DefaultPageSize, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));
            if (!await Context.Users.AnyAsync(u => u.Id == id))
                return NotFound();

            var query = Context.Events.Include(e => e.Creator).Where(e => e.CreatorId == id);
            if (!User.IsAdmin())
                query = query.Where(e => !e.Creator.IsBlocked); // sadrzaj blokiranih se ne prikazuje
            return Ok(await Pagination.GetPageAsync(query, after, limit));
        }

        // PUT /api/users/{id}/block - blokiranje (samo administrator): korisnik odmah gubi pristup -
        // TokenAuthenticationHandler odbija blokirane na svakom zahtevu, a token mu se i menja, pa ni
        // posle odblokiranja stara sesija ne vazi (mora ponovo da se prijavi). Vec blokiran -> isti
        // odgovor (idempotentno).
        [HttpPut]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/block")]
        public async Task<ActionResult> BlockUser(int id)
        {
            var user = await Context.Users.FindAsync(id);
            if (user == null)
                return NotFound(T("UserNotFound", id));
            user.IsBlocked = true;
            user.Token = GenerateToken();
            user.TokenExpiresAt = DateTime.UtcNow;
            await Context.SaveChangesAsync();
            return Ok(T("UserBlocked"));
        }

        // DELETE /api/users/{id}/block - odblokiranje (samo administrator)
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/block")]
        public async Task<ActionResult> UnblockUser(int id)
        {
            var user = await Context.Users.FindAsync(id);
            if (user == null)
                return NotFound(T("UserNotFound", id));
            user.IsBlocked = false;
            await Context.SaveChangesAsync();
            return Ok(T("UserUnblocked"));
        }

        // GET /api/users/{id}/details - admin: pregled jednog korisnika - javni podaci + status naloga
        // i koliko je puta prijavljen njegov sadrzaj (bez lozinke, heša i tokena, kao UserDto)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("{id:int}/details")]
        public async Task<ActionResult> GetUserDetails(int id)
        {
            var user = await Context.Users
                .Where(u => u.Id == id)
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Username,
                    u.Email,
                    u.DateOfBirth,
                    u.ProfileImage,
                    u.IsBlocked,
                    EventCount = Context.Events.Count(e => e.CreatorId == u.Id),
                    ReportCount = Context.ReportReasons.Count(r => r.Report.Event.CreatorId == u.Id),
                })
                .FirstOrDefaultAsync();
            if (user == null)
                return NotFound(T("UserNotFound", id));
            return Ok(user);
        }

        // GET /api/users/blocked - blokirani korisnici za admina, najnoviji nalozi prvi,
        // stranicenje kursorom kao i ostale liste (Models/Pagination.cs)
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("blocked")]
        public async Task<ActionResult> GetBlockedUsers([FromQuery] int limit = 20, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));
            var page = await Pagination.GetPageAsync(Context.Users.Where(u => u.IsBlocked), after, limit);
            var toDto = UserDto.Projection.Compile();
            return Ok(new { items = page.Items.Select(toDto), page.NextCursor, page.HasMore, page.Total });
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        private BadRequestObjectResult EmailTaken()
            => BadRequest(new { message = T("CheckInput"), errors = new Dictionary<string, string> { ["email"] = T("EmailTaken") } });

        private BadRequestObjectResult UsernameTaken()
            => BadRequest(new { message = T("CheckInput"), errors = new Dictionary<string, string> { ["username"] = T("UsernameTaken") } });

        // Potvrda lozinkom za osetljive akcije. Pogresna lozinka se broji kao neuspela prijava
        // (LoginProtection), pa ni ovde ne moze da se pogadja. null = lozinka je tacna.
        private ActionResult? VerifyPassword(User user, string? password, string field)
        {
            if (_loginProtection.GetRemainingLockout("k", user.Username) is TimeSpan remaining)
                return LockedOut(remaining);
            if (string.IsNullOrEmpty(password) || !Passwords.Verify(user.PasswordHash, password, out _))
            {
                _loginProtection.RecordFailure("k", user.Username);
                return BadRequest(new { message = T("WrongPassword"), errors = new Dictionary<string, string> { [field] = T("WrongPassword") } });
            }
            return null;
        }

        private ObjectResult LockedOut(TimeSpan remaining)
        {
            Response.Headers.RetryAfter = ((int)Math.Ceiling(remaining.TotalSeconds)).ToString();
            return StatusCode(StatusCodes.Status429TooManyRequests, new { message = LoginProtection.LockoutMessage(remaining, _t) });
        }

        // Nasumican token od 256 bita (64 hex znaka)
        private static string GenerateToken() => Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
    }
}
