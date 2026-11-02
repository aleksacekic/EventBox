using EventBoxApi.Auth;
using Microsoft.AspNetCore.Authorization;
using System.Linq;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Models;
using Microsoft.Extensions.Localization;
using Novi_backend_za_SWE;

namespace EventBoxApi.Controllers
{
    public class ReportRequest
    {
        public string Reason { get; set; }
        public string? Description { get; set; } // koristi se samo uz razlog "ostalo"
    }

    // Prijave dogadjaja (moderacija):
    //   POST   /api/events/{eventId}/reports   (korisnik prijavljuje dogadjaj)
    //   GET    /api/reports                    (admin: lista prijavljenih dogadjaja)
    //   DELETE /api/reports/{id}               (admin: odbaci prijavu, dogadjaj ostaje)
    [ApiController]
    [Route("api")]
    public class ReportsController : ControllerBase
    {
        public const int MaxDescriptionLength = 500;

        public EventBoxContext Context { get; set; }
        private readonly NotificationService _notifications;
        private readonly IStringLocalizer<SharedResource> _t;

        public ReportsController(EventBoxContext context, NotificationService notifications, IStringLocalizer<SharedResource> t)
        {
            Context = context;
            _notifications = notifications;
            _t = t;
        }

        // Poruka na jeziku zahteva (Accept-Language), vidi SharedResource.cs
        private string T(string key, params object[] args) => _t[key, args];

        // POST /api/events/{eventId}/reports  { "reason": "...", "description": "..." }
        // Prijava je JEDAN zahtev (razlog u telu): u istoj transakciji se pravi/pronalazi prijava
        // dogadjaja, dodaje razlog sa prijavljivacem i preracunava brojac. Pre su bila dva zahteva,
        // pa je pad izmedju njih ostavljao brojac bez razloga.
        [HttpPost]
        [EnableCors("CORS")]
        [Authorize]
        [Route("events/{eventId:int}/reports")]
        public async Task<ActionResult> ReportEvent(int eventId, [FromBody] ReportRequest request)
        {
            if (User.IsAdmin())
                return Forbid(); // prijavljuju samo korisnici
            int reporterId = User.GetUserId();

            if (request == null || !ReportReason.AllowedReasons.Contains(request.Reason))
                return BadRequest(T("UnknownReportReason"));
            string description = request.Reason == "ostalo" ? (request.Description ?? "").Trim() : "";
            if (description.Length > MaxDescriptionLength)
                return BadRequest(T("ReportDescriptionTooLong", MaxDescriptionLength));

            var ev = await Context.Events.FindAsync(eventId);
            if (ev == null)
                return NotFound();
            if (ev.CreatorId == reporterId)
                return BadRequest(T("CannotReportOwnEvent"));

            if (await Context.ReportReasons.AnyAsync(r => r.ReporterId == reporterId && r.Report.EventId == eventId))
                return Conflict(T("AlreadyReported"));

            // Retry (EnableRetryOnFailure u Program.cs) ne radi sa rucnom transakcijom, pa cela
            // transakcija ide kroz execution strategy: ako baza privremeno nije dostupna, ponovi se ceo blok.
            Report? report = null;
            ReportReason? reason = null;
            bool alreadyReported = false;
            var strategy = Context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                // Ponovni pokusaj: odbaci ono sto je prethodni (neuspeli) pokusaj dodao u context
                if (reason != null)
                    Context.Entry(reason).State = EntityState.Detached;
                if (report != null && Context.Entry(report).State == EntityState.Added)
                    Context.Entry(report).State = EntityState.Detached;

                await using var transaction = await Context.Database.BeginTransactionAsync();
                report = await Context.Reports.FirstOrDefaultAsync(r => r.EventId == eventId);
                if (report == null)
                {
                    report = new Report { EventId = eventId, ReportCount = 0 };
                    Context.Reports.Add(report);
                }
                reason = new ReportReason
                {
                    Report = report,
                    Reason = request.Reason,
                    Description = description,
                    ReporterId = reporterId
                };
                Context.ReportReasons.Add(reason);

                try
                {
                    await Context.SaveChangesAsync();
                }
                catch (DbUpdateException e) when (e.InnerException is SqlException { Number: 2601 or 2627 })
                {
                    // Jedinstveni indeksi: isti korisnik ili drugi prvi prijavljivac u istom trenutku.
                    // Samo greska duplikata - privremene greske baze idu dalje, na retry.
                    alreadyReported = true;
                    return; // transakcija se ponistava pri izlasku (await using)
                }
                // Brojac se racuna iz razloga jednim UPDATE-om (bez ++ koji gubi paralelne prijave)
                await Context.Database.ExecuteSqlInterpolatedAsync(
                    $"UPDATE Reports SET ReportCount = (SELECT COUNT(*) FROM ReportReasons WHERE ReportId = {report.Id}) WHERE Id = {report.Id}");
                await transaction.CommitAsync();
            });
            if (alreadyReported)
                return Conflict(T("ReportConflict"));

            // Autor saznaje razlog, ali ne i ko je prijavio
            await _notifications.NotifyOwnerAsync(ev, null, NotificationType.Report, request.Reason);
            return Ok(T("EventReported"));
        }

        // GET /api/reports - lista prijavljenih dogadjaja za admina: najnovija prijava prva,
        // stranicenje kursorom (vidi EventsController). Uz svaku prijavu najvise 5 razloga.
        [HttpGet]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("reports")]
        public async Task<ActionResult> GetReports([FromQuery] int limit = 4, [FromQuery] string? cursor = null)
        {
            if (!Pagination.TryDecodeCursor(cursor, out int? after))
                return BadRequest(T("InvalidCursor"));

            var query = Context.Reports
                .Include(r => r.Event).ThenInclude(e => e.Creator)
                .Include(r => r.Reasons);
            var page = await Pagination.GetPageAsync(query, after, limit);
            page.Items.ForEach(r => r.Reasons = r.Reasons.Take(5).ToList());
            return Ok(page);
        }

        // DELETE /api/reports/{id} - odbacuje prijavu (dogadjaj ostaje objavljen)
        [HttpDelete]
        [EnableCors("CORS")]
        [Authorize(Roles = "Admin")]
        [Route("reports/{id:int}")]
        public async Task<ActionResult> DismissReport(int id)
        {
            var report = await Context.Reports.FindAsync(id);
            if (report == null)
                return NotFound();
            // Razlozi se brisu kaskadno u bazi
            Context.Reports.Remove(report);
            await Context.SaveChangesAsync();
            return Ok(T("ReportDismissed"));
        }
    }
}
