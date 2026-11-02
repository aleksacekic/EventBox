using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Microsoft.AspNetCore.SignalR;

namespace Models
{
    // Tipovi notifikacija (kolona Notifikacija.TipReakcije). Vrednosti su upisane u bazi, pa ostaju iste.
    public static class NotificationType
    {
        public const string Reaction = "Reakcija"; // SadrzajReakcije = tip reakcije (Zainteresovan, Mozda...)
        public const string Comment = "Komentar";  // SadrzajReakcije = tekst komentara
        public const string Report = "Prijava";    // SadrzajReakcije = razlog prijave; ko je prijavio se ne otkriva
    }

    // Ono sto klijent dobija za notifikaciju - i u listi i uzivo kroz SignalR (isti oblik)
    public class NotifikacijaDto
    {
        public int Id { get; set; }
        public int DogadjajId { get; set; }
        public string NaslovDogadjaja { get; set; }
        public string? KorisnikKojiReaguje { get; set; } // korisnicko ime; null za anonimno (prijava)
        public string Tip { get; set; }
        public string? Sadrzaj { get; set; }
        public DateTime Vreme { get; set; } // UTC

        public static readonly Expression<Func<Notifikacija, NotifikacijaDto>> Projekcija = n => new NotifikacijaDto
        {
            Id = n.Id,
            DogadjajId = n.DogadjajId,
            NaslovDogadjaja = n.Dogadjaj.Naslov,
            KorisnikKojiReaguje = n.KorisnikKojiReaguje != null ? n.KorisnikKojiReaguje.Korisnicko_Ime : null,
            Tip = n.TipReakcije,
            Sadrzaj = n.SadrzajReakcije,
            Vreme = n.Vreme
        };
    }

    // Poruka u cetu kako je vide klijenti (i u istoriji i uzivo)
    public class PorukaDto
    {
        public int Id { get; set; }
        public int PosiljaocId { get; set; }
        public int PrimaocId { get; set; }
        public string Sadrzaj { get; set; }
        public DateTime Vreme { get; set; } // UTC
        public bool JelProcitano { get; set; }

        public static PorukaDto From(Poruka p) => new PorukaDto
        {
            Id = p.Id, PosiljaocId = p.PosiljaocId, PrimaocId = p.PrimaocId,
            Sadrzaj = p.Sadrzaj, Vreme = p.Vreme, JelProcitano = p.JelProcitano
        };
    }

    // Sve sto server salje korisnicima uzivo ide odavde: PRVO upis u bazu, PA slanje kroz SignalR.
    // Ako primalac nije online, notifikacija/poruka je svejedno sacuvana i vidi je kad se vrati.
    // Imena dogadjaja koje klijent slusa (src/notifications.jsx): NotificationCreated,
    // NotificationUpdated, NotificationDeleted i MessageReceived.
    public class NotificationService
    {
        private readonly EventBoxContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ILogger<NotificationService> _log;

        public NotificationService(EventBoxContext context, IHubContext<NotificationHub> hub, ILogger<NotificationService> log)
        {
            _context = context;
            _hub = hub;
            _log = log;
        }

        // Notifikacija vlasniku dogadjaja. Za sopstvene akcije na svom dogadjaju se ne pravi.
        // Za reakciju postoji najvise jedna notifikacija: promena reakcije menja postojecu
        // (i pomera je na vrh), umesto da pravi novu.
        public async Task NotifyOwnerAsync(Dogadjaj dogadjaj, int? reagujeId, string tip, string? sadrzaj,
                                           int? komentarId = null, int? reakcijaId = null)
        {
            if (reagujeId == dogadjaj.ID_Kreatora)
                return;

            Notifikacija? n = reakcijaId == null ? null
                : await _context.Notifikacije.FirstOrDefaultAsync(x => x.ReakcijaId == reakcijaId);
            if (n == null)
            {
                n = new Notifikacija
                {
                    DogadjajId = dogadjaj.Id,
                    KorisnikCijaJeObjavaId = dogadjaj.ID_Kreatora,
                    KorisnikKojiReagujeId = reagujeId,
                    TipReakcije = tip,
                    KomentarId = komentarId,
                    ReakcijaId = reakcijaId
                };
                _context.Notifikacije.Add(n);
            }
            n.SadrzajReakcije = sadrzaj ?? "";
            n.Vreme = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await SendAsync(dogadjaj.ID_Kreatora, "NotificationCreated", await GetDtoAsync(n.Id));
        }

        // Komentar je izmenjen: notifikacija dobija novi tekst, ostaje na istom mestu u listi
        public async Task UpdateCommentNotificationAsync(Komentar k)
        {
            var n = await _context.Notifikacije.FirstOrDefaultAsync(x => x.KomentarId == k.Id);
            if (n == null)
                return;
            n.SadrzajReakcije = k.Tekst;
            await _context.SaveChangesAsync();
            await SendAsync(n.KorisnikCijaJeObjavaId, "NotificationUpdated", await GetDtoAsync(n.Id));
        }

        // Pre brisanja komentara/reakcije (FK je bez kaskade): brise njihovu notifikaciju u istom
        // SaveChanges kao i sam komentar/reakciju, a vlasniku javlja posle (NotifyRemovedAsync)
        public async Task<List<(int Id, int Vlasnik)>> RemoveAsync(IQueryable<Notifikacija> koje)
        {
            var lista = await koje.ToListAsync();
            _context.Notifikacije.RemoveRange(lista);
            return lista.Select(n => (n.Id, n.KorisnikCijaJeObjavaId)).ToList();
        }

        public async Task NotifyRemovedAsync(List<(int Id, int Vlasnik)> uklonjene)
        {
            foreach (var (id, vlasnik) in uklonjene)
                await SendAsync(vlasnik, "NotificationDeleted", id);
        }

        private Task<NotifikacijaDto> GetDtoAsync(int id)
            => _context.Notifikacije.Where(x => x.Id == id).Select(NotifikacijaDto.Projekcija).FirstAsync();

        // Poruka je vec upisana u bazu (MessagesController); ovde se samo javlja primaocu
        public Task NotifyNewMessageAsync(Poruka p) => SendAsync(p.PrimaocId, "MessageReceived", PorukaDto.From(p));

        // Slanje uzivo je "najbolji pokusaj": ako ne uspe, podatak je vec u bazi, pa zahtev ne pada
        private async Task SendAsync(int korisnikId, string dogadjaj, object podatak)
        {
            try
            {
                await _hub.Clients.User(korisnikId.ToString()).SendAsync(dogadjaj, podatak);
            }
            catch (Exception ex)
            {
                _log.LogWarning(ex, "SignalR {Dogadjaj} korisniku {Id} nije poslat", dogadjaj, korisnikId);
            }
        }
    }
}
