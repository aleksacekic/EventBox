using Microsoft.EntityFrameworkCore;

namespace Models
{
    // Baza: imena tabela su imena DbSet-ova (Users, Events, ...), kolone su imena svojstava.
    public class EventBoxContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<ReportReason> ReportReasons { get; set; }

        public EventBoxContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Users -> Events -> Comments/Reactions je kaskadno (brisanje naloga brise njegove dogadjaje,
            // a dogadjaj svoje komentare i reakcije). SQL Server ne dozvoljava drugi kaskadni put do iste
            // tabele ("multiple cascade paths"), pa su ostale veze ka Users bez kaskade (NoAction) -
            // te redove brise UsersController.DeleteUser pre brisanja naloga.
            modelBuilder.Entity<Event>()
                .HasOne(e => e.Creator)
                .WithMany(u => u.CreatedEvents)
                .HasForeignKey(e => e.CreatorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Author)
                .WithMany()
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Event)
                .WithMany(e => e.Comments)
                .HasForeignKey(c => c.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Reaction>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Reaction>()
                .HasOne(r => r.Event)
                .WithMany(e => e.Reactions)
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            // Jedna reakcija po korisniku po dogadjaju
            modelBuilder.Entity<Reaction>()
                .HasIndex(r => new { r.UserId, r.EventId })
                .IsUnique();
            modelBuilder.Entity<Reaction>()
                .ToTable(t => t.HasCheckConstraint("CK_Reactions_Type",
                    "[Type] IN (N'Zainteresovan', N'Mozda', N'Nezainteresovan')"));

            // Notifikacija ima vise veza ka Users i Events; kaskadna je samo veza ka primaocu
            // (brisanje naloga brise i njegove notifikacije). Notifikacije komentara/reakcije i
            // dogadjaja brise kod (NotificationService.RemoveAsync, EventsController.DeleteEvent).
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Recipient)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.RecipientId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Actor)
                .WithMany()
                .HasForeignKey(n => n.ActorId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Event)
                .WithMany()
                .HasForeignKey(n => n.EventId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Comment)
                .WithMany()
                .HasForeignKey(n => n.CommentId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Reaction)
                .WithMany()
                .HasForeignKey(n => n.ReactionId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Message>()
                .HasOne<User>().WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<Message>()
                .HasOne<User>().WithMany()
                .HasForeignKey(m => m.RecipientId)
                .OnDelete(DeleteBehavior.NoAction);
            // Cet: razgovor (posiljalac, primalac) se cita po kursoru (Id opadajuce), a broj
            // neprocitanih po (primalac, procitano) - bez ovih indeksa oba upita skeniraju celu tabelu
            modelBuilder.Entity<Message>().HasIndex(m => new { m.SenderId, m.RecipientId });
            modelBuilder.Entity<Message>().HasIndex(m => new { m.RecipientId, m.IsRead });

            // Prijave: jedan red u Reports po dogadjaju, a jedan korisnik moze isti dogadjaj da
            // prijavi samo jednom. Filtrirani indeks jer ReporterId moze biti NULL
            // (SQL Server inace tretira vise NULL-ova kao duplikate).
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Event)
                .WithMany()
                .HasForeignKey(r => r.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<Report>()
                .HasIndex(r => r.EventId)
                .IsUnique();
            modelBuilder.Entity<ReportReason>()
                .HasOne(r => r.Report)
                .WithMany(r => r.Reasons)
                .HasForeignKey(r => r.ReportId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ReportReason>()
                .HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.NoAction);
            modelBuilder.Entity<ReportReason>()
                .HasIndex(r => new { r.ReporterId, r.ReportId })
                .IsUnique()
                .HasFilter("[ReporterId] IS NOT NULL");
            modelBuilder.Entity<ReportReason>()
                .ToTable(t => t.HasCheckConstraint("CK_ReportReasons_Reason",
                    "[Reason] IN (N'nepozeljan', N'nasilje', N'terorizam', N'govor_mrznje', N'lazne_informacije', N'uznemiravanje', N'ostalo')"));

            // Jedinstvena korisnicka imena i email adrese. Indeksi ujedno ubrzavaju prijavu.
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique()
                .HasDatabaseName(EmailRules.UniqueIndexName);
            modelBuilder.Entity<Admin>().HasIndex(a => a.Username).IsUnique();

            // Token se trazi na SVAKOM zahtevu (TokenAuthenticationHandler) - bez indeksa je to
            // prolaz kroz celu tabelu. Jedinstven je jer jedan token sme da pripada samo jednom
            // nalogu. Kod administratora je Token nullable, pa EF pravi filtrirani indeks
            // (WHERE [Token] IS NOT NULL) i vise odjavljenih admina bez tokena ne smeta.
            modelBuilder.Entity<User>().HasIndex(u => u.Token).IsUnique();
            modelBuilder.Entity<Admin>().HasIndex(a => a.Token).IsUnique();
        }
    }
}
