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

            // Notifikacija i Poruka imaju vise veza ka Korisniku/Dogadjaju, a Korisnik -> Dogadjaj
            // i Korisnik -> Notifikacija su vec kaskadni; SQL Server ne dozvoljava vise kaskadnih
            // puteva do iste tabele. Zato su sve ove veze NoAction, a zavisne redove brisu
            // IzbrisiKorisnika i IzbrisiDogadjaj (u istoj transakciji).
            modelBuilder.Entity<Notifikacija>()
                .HasOne<Dogadjaj>().WithMany()
                .HasForeignKey(n => n.DogadjajId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Notifikacija>()
                .HasOne<Korisnik>().WithMany()
                .HasForeignKey(n => n.KorisnikKojiReagujeId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Poruka>()
                .HasOne<Korisnik>().WithMany()
                .HasForeignKey(m => m.PosiljaocId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Poruka>()
                .HasOne<Korisnik>().WithMany()
                .HasForeignKey(m => m.PrimaocId)
                .OnDelete(DeleteBehavior.NoAction);

            // Prijave: jedan red Prijavljeni_dogadjaj po dogadjaju, a jedan korisnik moze isti
            // dogadjaj da prijavi samo jednom. Filtrirani indeks jer PrijavioId moze biti NULL
            // (SQL Server inace tretira vise NULL-ova kao duplikate).
            modelBuilder.Entity<Prijavljeni_dogadjaj>()
                .HasIndex("Dogadjaj_IdId")
                .IsUnique();
            modelBuilder.Entity<Razlog>()
                .HasOne(r => r.Prijavio).WithMany()
                .HasForeignKey(r => r.PrijavioId)
                .OnDelete(DeleteBehavior.NoAction); // Korisnik -> Dogadjaj -> Prijava -> Razlog je vec kaskadno
            modelBuilder.Entity<Razlog>()
                .HasIndex("PrijavioId", "Prijavljeni_dogadjaj_IdId")
                .IsUnique()
                .HasFilter("[PrijavioId] IS NOT NULL");
            modelBuilder.Entity<Razlog>()
                .ToTable(t => t.HasCheckConstraint("CK_Razlog_Razlog_prijave",
                    "[Razlog_prijave] IN (N'nepozeljan', N'nasilje', N'terorizam', N'govor_mrznje', N'lazne_informacije', N'uznemiravanje', N'ostalo')"));

            // Cet: razgovor (posiljalac, primalac) se cita po kursoru (Id opadajuce), a broj
            // neprocitanih po (primalac, procitano) - bez ovih indeksa oba upita skeniraju celu tabelu
            modelBuilder.Entity<Poruka>().HasIndex(m => new { m.PosiljaocId, m.PrimaocId });
            modelBuilder.Entity<Poruka>().HasIndex(m => new { m.PrimaocId, m.JelProcitano });

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
