using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <summary>
    /// Sema na engleskom BEZ gubitka podataka. EF bi za preimenovane klase tabele obrisao i napravio
    /// iznova, pa je migracija napisana rucno: tabele, kolone, indeksi i ogranicenja se PREIMENUJU.
    /// Jedina promena tipa: Korisnik.Blokiran (int, -1 = blokiran) postaje Users.IsBlocked (bit).
    /// Sve se izvrsava u jednoj transakciji - ili prodje cela migracija, ili se nista ne promeni.
    /// </summary>
    public partial class EnglishNames : Migration
    {
        // stara tabela -> nova
        private static readonly (string Old, string New)[] Tables =
        {
            ("Korisnik", "Users"),
            ("Administrator", "Admins"),
            ("Dogadjaj", "Events"),
            ("Komentar", "Comments"),
            ("Reakcija", "Reactions"),
            ("Poruka", "Messages"),
            ("Notifikacija", "Notifications"),
            ("Prijavljeni_dogadjaj", "Reports"),
            ("Razlog", "ReportReasons"),
        };

        // (nova tabela, stara kolona, nova kolona)
        private static readonly (string Table, string Old, string New)[] Columns =
        {
            ("Users", "Ime", "FirstName"),
            ("Users", "Prezime", "LastName"),
            ("Users", "Korisnicko_Ime", "Username"),
            ("Users", "Lozinka_Hashirana", "PasswordHash"),
            ("Users", "Datum_rodjenja", "DateOfBirth"),
            ("Users", "Email_Adresa", "Email"),
            ("Users", "Validnost", "TokenExpiresAt"),
            ("Users", "KorisnikImage", "ProfileImage"),

            ("Admins", "Ime", "FirstName"),
            ("Admins", "Prezime", "LastName"),
            ("Admins", "Email_adresa", "Email"),
            ("Admins", "Korisnicko_ime", "Username"),
            ("Admins", "Lozinka", "PasswordHash"),
            ("Admins", "Validnost", "TokenExpiresAt"),

            ("Events", "ID_Kreatora", "CreatorId"),
            ("Events", "Datum_Objave", "CreatedAt"),
            ("Events", "Naslov", "Title"),
            ("Events", "Datum_Dogadjaja", "Date"),
            ("Events", "Vreme_pocetka", "StartTime"),
            ("Events", "Opis", "Description"),
            ("Events", "Kategorija", "Category"),
            ("Events", "X", "Latitude"),
            ("Events", "Y", "Longitude"),
            ("Events", "Broj_Zainteresovanih", "InterestedCount"),
            ("Events", "Broj_Mozda", "MaybeCount"),
            ("Events", "Broj_Nezainteresovanih", "NotInterestedCount"),
            ("Events", "DogadjajImage", "Image"),

            ("Comments", "Tekst", "Text"),
            ("Comments", "AutorId", "AuthorId"),
            ("Comments", "Vreme", "CreatedAt"),
            ("Comments", "Dogadjaj_IdId", "EventId"),

            ("Reactions", "Tip", "Type"),
            ("Reactions", "Korisnik_ID", "UserId"),
            ("Reactions", "Dogadjaj_IDId", "EventId"),

            ("Messages", "PosiljaocId", "SenderId"),
            ("Messages", "PrimaocId", "RecipientId"),
            ("Messages", "Sadrzaj", "Content"),
            ("Messages", "Vreme", "SentAt"),
            ("Messages", "JelProcitano", "IsRead"),

            ("Notifications", "DogadjajId", "EventId"),
            ("Notifications", "KorisnikCijaJeObjavaId", "RecipientId"),
            ("Notifications", "KorisnikKojiReagujeId", "ActorId"),
            ("Notifications", "TipReakcije", "Type"),
            ("Notifications", "SadrzajReakcije", "Content"),
            ("Notifications", "Vreme", "CreatedAt"),
            ("Notifications", "KomentarId", "CommentId"),
            ("Notifications", "ReakcijaId", "ReactionId"),

            ("Reports", "Dogadjaj_IdId", "EventId"),
            ("Reports", "Broj_prijava", "ReportCount"),

            ("ReportReasons", "Prijavljeni_dogadjaj_IdId", "ReportId"),
            ("ReportReasons", "Razlog_prijave", "Reason"),
            ("ReportReasons", "Opis", "Description"),
            ("ReportReasons", "PrijavioId", "ReporterId"),
        };

        // (nova tabela, stari indeks, novi indeks). Filtrirani indeks prijava nije ovde:
        // njegov filter sadrzi ime kolone, pa se brise i pravi iznova.
        private static readonly (string Table, string Old, string New)[] Indexes =
        {
            ("Users", "IX_Korisnik_Email_Adresa", "IX_Users_Email"),
            ("Users", "IX_Korisnik_Korisnicko_Ime", "IX_Users_Username"),
            ("Users", "IX_Korisnik_Token", "IX_Users_Token"),
            ("Admins", "IX_Administrator_Korisnicko_ime", "IX_Admins_Username"),
            ("Admins", "IX_Administrator_Token", "IX_Admins_Token"),
            ("Events", "IX_Dogadjaj_ID_Kreatora", "IX_Events_CreatorId"),
            ("Comments", "IX_Komentar_AutorId", "IX_Comments_AuthorId"),
            ("Comments", "IX_Komentar_Dogadjaj_IdId", "IX_Comments_EventId"),
            ("Reactions", "IX_Reakcija_Dogadjaj_IDId", "IX_Reactions_EventId"),
            ("Reactions", "IX_Reakcija_Korisnik_ID_Dogadjaj_IDId", "IX_Reactions_UserId_EventId"),
            ("Messages", "IX_Poruka_PosiljaocId_PrimaocId", "IX_Messages_SenderId_RecipientId"),
            ("Messages", "IX_Poruka_PrimaocId_JelProcitano", "IX_Messages_RecipientId_IsRead"),
            ("Notifications", "IX_Notifikacija_DogadjajId", "IX_Notifications_EventId"),
            ("Notifications", "IX_Notifikacija_KomentarId", "IX_Notifications_CommentId"),
            ("Notifications", "IX_Notifikacija_KorisnikCijaJeObjavaId", "IX_Notifications_RecipientId"),
            ("Notifications", "IX_Notifikacija_KorisnikKojiReagujeId", "IX_Notifications_ActorId"),
            ("Notifications", "IX_Notifikacija_ReakcijaId", "IX_Notifications_ReactionId"),
            ("Reports", "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId", "IX_Reports_EventId"),
            ("ReportReasons", "IX_Razlog_Prijavljeni_dogadjaj_IdId", "IX_ReportReasons_ReportId"),
        };

        // Primarni i strani kljucevi: stari naziv -> novi (EF konvencija: PK_Tabela, FK_Tabela_Tabela_Kolona)
        private static readonly (string Old, string New)[] Keys =
        {
            ("PK_Korisnik", "PK_Users"),
            ("PK_Administrator", "PK_Admins"),
            ("PK_Dogadjaj", "PK_Events"),
            ("PK_Komentar", "PK_Comments"),
            ("PK_Reakcija", "PK_Reactions"),
            ("PK_Poruka", "PK_Messages"),
            ("PK_Notifikacija", "PK_Notifications"),
            ("PK_Prijavljeni_dogadjaj", "PK_Reports"),
            ("PK_Razlog", "PK_ReportReasons"),

            ("FK_Dogadjaj_Korisnik_ID_Kreatora", "FK_Events_Users_CreatorId"),
            ("FK_Komentar_Dogadjaj_Dogadjaj_IdId", "FK_Comments_Events_EventId"),
            ("FK_Komentar_Korisnik_AutorId", "FK_Comments_Users_AuthorId"),
            ("FK_Reakcija_Dogadjaj_Dogadjaj_IDId", "FK_Reactions_Events_EventId"),
            ("FK_Reakcija_Korisnik_Korisnik_ID", "FK_Reactions_Users_UserId"),
            ("FK_Poruka_Korisnik_PosiljaocId", "FK_Messages_Users_SenderId"),
            ("FK_Poruka_Korisnik_PrimaocId", "FK_Messages_Users_RecipientId"),
            ("FK_Notifikacija_Dogadjaj_DogadjajId", "FK_Notifications_Events_EventId"),
            ("FK_Notifikacija_Komentar_KomentarId", "FK_Notifications_Comments_CommentId"),
            ("FK_Notifikacija_Korisnik_KorisnikCijaJeObjavaId", "FK_Notifications_Users_RecipientId"),
            ("FK_Notifikacija_Korisnik_KorisnikKojiReagujeId", "FK_Notifications_Users_ActorId"),
            ("FK_Notifikacija_Reakcija_ReakcijaId", "FK_Notifications_Reactions_ReactionId"),
            ("FK_Prijavljeni_dogadjaj_Dogadjaj_Dogadjaj_IdId", "FK_Reports_Events_EventId"),
            ("FK_Razlog_Korisnik_PrijavioId", "FK_ReportReasons_Users_ReporterId"),
            ("FK_Razlog_Prijavljeni_dogadjaj_Prijavljeni_dogadjaj_IdId", "FK_ReportReasons_Reports_ReportId"),
        };

        private const string ReactionTypes = "N'Zainteresovan', N'Mozda', N'Nezainteresovan'";
        private const string ReportReasonCodes =
            "N'nepozeljan', N'nasilje', N'terorizam', N'govor_mrznje', N'lazne_informacije', N'uznemiravanje', N'ostalo'";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // CHECK ogranicenja i filtrirani indeks u svojoj definiciji sadrze ime kolone: sklanjaju
            // se pre preimenovanja i na kraju prave ponovo, sa novim imenima
            migrationBuilder.DropCheckConstraint(name: "CK_Reakcija_Tip", table: "Reakcija");
            migrationBuilder.DropCheckConstraint(name: "CK_Razlog_Razlog_prijave", table: "Razlog");
            migrationBuilder.DropIndex(name: "IX_Razlog_PrijavioId_Prijavljeni_dogadjaj_IdId", table: "Razlog");

            foreach (var (oldName, newName) in Tables)
                migrationBuilder.RenameTable(name: oldName, newName: newName);
            foreach (var (table, oldName, newName) in Columns)
                migrationBuilder.RenameColumn(name: oldName, table: table, newName: newName);
            foreach (var (table, oldName, newName) in Indexes)
                migrationBuilder.RenameIndex(name: oldName, table: table, newName: newName);
            foreach (var (oldName, newName) in Keys)
                RenameConstraint(migrationBuilder, oldName, newName);

            // Blokiran (-1 / 0) -> IsBlocked (true / false)
            migrationBuilder.AddColumn<bool>(name: "IsBlocked", table: "Users", type: "bit", nullable: false, defaultValue: false);
            migrationBuilder.Sql("UPDATE [Users] SET [IsBlocked] = CASE WHEN [Blokiran] = -1 THEN 1 ELSE 0 END;");
            migrationBuilder.DropColumn(name: "Blokiran", table: "Users");
            DropDefaultConstraint(migrationBuilder, "Users", "IsBlocked"); // podrazumevana vrednost je trebala samo za postojece redove

            migrationBuilder.CreateIndex(
                name: "IX_ReportReasons_ReporterId_ReportId",
                table: "ReportReasons",
                columns: new[] { "ReporterId", "ReportId" },
                unique: true,
                filter: "[ReporterId] IS NOT NULL");
            migrationBuilder.AddCheckConstraint(name: "CK_Reactions_Type", table: "Reactions", sql: $"[Type] IN ({ReactionTypes})");
            migrationBuilder.AddCheckConstraint(name: "CK_ReportReasons_Reason", table: "ReportReasons", sql: $"[Reason] IN ({ReportReasonCodes})");
        }

        // Vracanje na srpska imena (dotnet ef database update EmailJedinstvenISesijeUtc), isto bez gubitka podataka
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(name: "CK_Reactions_Type", table: "Reactions");
            migrationBuilder.DropCheckConstraint(name: "CK_ReportReasons_Reason", table: "ReportReasons");
            migrationBuilder.DropIndex(name: "IX_ReportReasons_ReporterId_ReportId", table: "ReportReasons");

            migrationBuilder.AddColumn<int>(name: "Blokiran", table: "Users", type: "int", nullable: false, defaultValue: 0);
            migrationBuilder.Sql("UPDATE [Users] SET [Blokiran] = CASE WHEN [IsBlocked] = 1 THEN -1 ELSE 0 END;");
            migrationBuilder.DropColumn(name: "IsBlocked", table: "Users");
            DropDefaultConstraint(migrationBuilder, "Users", "Blokiran");

            foreach (var (oldName, newName) in Keys)
                RenameConstraint(migrationBuilder, newName, oldName);
            foreach (var (table, oldName, newName) in Indexes)
                migrationBuilder.RenameIndex(name: newName, table: table, newName: oldName);
            foreach (var (table, oldName, newName) in Columns)
                migrationBuilder.RenameColumn(name: newName, table: table, newName: oldName);
            foreach (var (oldName, newName) in Tables)
                migrationBuilder.RenameTable(name: newName, newName: oldName);

            migrationBuilder.CreateIndex(
                name: "IX_Razlog_PrijavioId_Prijavljeni_dogadjaj_IdId",
                table: "Razlog",
                columns: new[] { "PrijavioId", "Prijavljeni_dogadjaj_IdId" },
                unique: true,
                filter: "[PrijavioId] IS NOT NULL");
            migrationBuilder.AddCheckConstraint(name: "CK_Reakcija_Tip", table: "Reakcija", sql: $"[Tip] IN ({ReactionTypes})");
            migrationBuilder.AddCheckConstraint(name: "CK_Razlog_Razlog_prijave", table: "Razlog", sql: $"[Razlog_prijave] IN ({ReportReasonCodes})");
        }

        // EF nema operaciju za preimenovanje primarnog/stranog kljuca, pa ide direktno preko sp_rename
        private static void RenameConstraint(MigrationBuilder migrationBuilder, string oldName, string newName)
            => migrationBuilder.Sql($"EXEC sp_rename N'[dbo].[{oldName}]', N'{newName}', N'OBJECT';");

        // Podrazumevana vrednost (DEFAULT) ima ime koje SQL Server sam izmisli, pa se trazi po koloni
        private static void DropDefaultConstraint(MigrationBuilder migrationBuilder, string table, string column)
            => migrationBuilder.Sql($@"
DECLARE @name sysname = (
    SELECT dc.name FROM sys.default_constraints dc
    JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'[{table}]') AND c.name = N'{column}');
IF @name IS NOT NULL EXEC(N'ALTER TABLE [{table}] DROP CONSTRAINT [' + @name + N']');");
    }
}
