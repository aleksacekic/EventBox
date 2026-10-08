using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using Microsoft.AspNetCore.SignalR;

namespace Models
{
    // Tipovi notifikacija (kolona Notifikacija.TipReakcije)
    public static class TipNotifikacije
    {
        public const string Reakcija = "Reakcija"; // SadrzajReakcije = tip reakcije (Zainteresovan, Mozda...)
        public const string Komentar = "Komentar"; // SadrzajReakcije = tekst komentara
        public const string Prijava = "Prijava";   // SadrzajReakcije = razlog prijave; ko je prijavio se ne otkriva
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

        public static PorukaDto Od(Poruka p) => new PorukaDto
        {
            Id = p.Id, PosiljaocId = p.PosiljaocId, PrimaocId = p.PrimaocId,
            Sadrzaj = p.Sadrzaj, Vreme = p.Vreme, JelProcitano = p.JelProcitano
        };
    }

    // Sve sto server salje korisnicima uzivo ide odavde: PRVO upis u bazu, PA slanje kroz SignalR.
    // Ako primalac nije online, notifikacija/poruka je svejedno sacuvana i vidi je kad se vrati.
    public class Obavestenja
    {
        private readonly EventBoxContext _context;
        private readonly IHubContext<NotificationHub> _hub;
        private readonly ILogger<Obavestenja> _log;

        public Obavestenja(EventBoxContext context, IHubContext<NotificationHub> hub, ILogger<Obavestenja> log)
        {
            _context = context;
            _hub = hub;
            _log = log;
        }

        // Notifikacija vlasniku dogadjaja. Za sopstvene akcije na svom dogadjaju se ne pravi.
        // Za reakciju postoji najvise jedna notifikacija: promena reakcije menja postojecu
        // (i pomera je na vrh), umesto da pravi novu.
        public async Task NotifikujVlasnikaAsync(Dogadjaj dogadjaj, int? reagujeId, string tip, string? sadrzaj,
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

            await PosaljiAsync(dogadjaj.ID_Kreatora, "NovaNotifikacija", await DtoAsync(n.Id));
        }

        // Komentar je izmenjen: notifikacija dobija novi tekst, ostaje na istom mestu u listi
        public async Task IzmeniZaKomentarAsync(Komentar k)
        {
            var n = await _context.Notifikacije.FirstOrDefaultAsync(x => x.KomentarId == k.Id);
            if (n == null)
                return;
            n.SadrzajReakcije = k.Tekst;
            await _context.SaveChangesAsync();
            await PosaljiAsync(n.KorisnikCijaJeObjavaId, "NotifikacijaIzmenjena", await DtoAsync(n.Id));
        }

        // Pre brisanja komentara/reakcije (FK je bez kaskade): brise njihovu notifikaciju u istom
        // SaveChanges kao i sam komentar/reakciju, a vlasniku javlja posle (JaviUklonjeneAsync)
        public async Task<List<(int Id, int Vlasnik)>> UkloniAsync(IQueryable<Notifikacija> koje)
        {
            var lista = await koje.ToListAsync();
            _context.Notifikacije.RemoveRange(lista);
            return lista.Select(n => (n.Id, n.KorisnikCijaJeObjavaId)).ToList();
        }

        public async Task JaviUklonjeneAsync(List<(int Id, int Vlasnik)> uklonjene)
        {
            foreach (var (id, vlasnik) in uklonjene)
                await PosaljiAsync(vlasnik, "NotifikacijaObrisana", id);
        }

        private Task<NotifikacijaDto> DtoAsync(int id)
            => _context.Notifikacije.Where(x => x.Id == id).Select(NotifikacijaDto.Projekcija).FirstAsync();

        // Poruka je vec upisana u bazu (PorukaController); ovde se samo javlja primaocu
        public Task JaviNovuPorukuAsync(Poruka p) => PosaljiAsync(p.PrimaocId, "NovaPoruka", PorukaDto.Od(p));

        // Slanje uzivo je "najbolji pokusaj": ako ne uspe, podatak je vec u bazi, pa zahtev ne pada
        private async Task PosaljiAsync(int korisnikId, string dogadjaj, object podatak)
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
