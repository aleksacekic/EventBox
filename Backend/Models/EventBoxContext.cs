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
        }
    }
}
