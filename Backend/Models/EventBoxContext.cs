using Microsoft.EntityFrameworkCore;

namespace Models
{
    public class EventBoxContext : DbContext
    {
        public DbSet<Dogadjaj> Dogadjaji {get; set;}
        public DbSet<Korisnik> Korisnici {get; set;}
        public DbSet<Administrator> Administratori {get; set;}
        public DbSet<Reakcija> Reakcije {get; set;}
        public DbSet<Komentar> Komentari {get; set;}
        public DbSet<Notifikacija> Notifikacije {get; set;}
        public DbSet<Razlog> Razlozi {get; set;}
        public DbSet<Prijavljeni_dogadjaj> Prijavljeni_dogadjaji {get; set;}
        public DbSet<Poruka> Poruke {get; set;}

        public EventBoxContext(DbContextOptions options) : base(options)
        {

        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Komentar -> Autor: bez kaskade u bazi. Korisnik -> Dogadjaj -> Komentar je vec
            // kaskadno, pa bi drugi kaskadni put do Komentara SQL Server odbio ("multiple
            // cascade paths"). Komentare autora brise IzbrisiKorisnika pre brisanja naloga.
            modelBuilder.Entity<Komentar>()
                .HasOne(k => k.Autor)
                .WithMany()
                .HasForeignKey(k => k.AutorId)
                .OnDelete(DeleteBehavior.NoAction);

            // Reakcija -> Korisnik: isti razlog kao gore (Korisnik -> Dogadjaj -> Reakcija je
            // vec kaskadno). Reakcije korisnika brise IzbrisiKorisnika pre brisanja naloga.
            modelBuilder.Entity<Reakcija>()
                .HasOne(r => r.Korisnik)
                .WithMany()
                .HasForeignKey(r => r.Korisnik_ID)
                .OnDelete(DeleteBehavior.NoAction);

            // Jedna reakcija po korisniku po dogadjaju
            modelBuilder.Entity<Reakcija>()
                .HasIndex("Korisnik_ID", "Dogadjaj_IDId")
                .IsUnique();

            modelBuilder.Entity<Reakcija>()
                .ToTable(t => t.HasCheckConstraint("CK_Reakcija_Tip",
                    "[Tip] IN (N'Zainteresovan', N'Mozda', N'Nezainteresovan')"));

            // Jedinstvena korisnicka imena. Indeks ujedno ubrzava prijavu (trazenje po imenu).
            modelBuilder.Entity<Korisnik>().HasIndex(k => k.Korisnicko_Ime).IsUnique();
            modelBuilder.Entity<Administrator>().HasIndex(a => a.Korisnicko_ime).IsUnique();

            // Token se trazi na SVAKOM zahtevu (TokenAuthenticationHandler) - bez indeksa je to
            // prolaz kroz celu tabelu. Jedinstven je jer jedan token sme da pripada samo jednom
            // nalogu. Kod administratora je Token nullable, pa EF pravi filtrirani indeks
            // (WHERE [Token] IS NOT NULL) i vise odjavljenih admina bez tokena ne smeta.
            modelBuilder.Entity<Korisnik>().HasIndex(k => k.Token).IsUnique();
            modelBuilder.Entity<Administrator>().HasIndex(a => a.Token).IsUnique();
        }
    }
}
