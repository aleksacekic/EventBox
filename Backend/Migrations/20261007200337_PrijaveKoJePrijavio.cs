using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class PrijaveKoJePrijavio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Cisti postojece prijave da bi ogranicenja mogla da se dodaju
            migrationBuilder.Sql(@"
-- vise redova Prijavljeni_dogadjaj za isti dogadjaj: razlozi se prebace na red sa najmanjim Id-em
UPDATE r SET Prijavljeni_dogadjaj_IdId = m.MinId
FROM Razlog r
JOIN Prijavljeni_dogadjaj p ON p.Id = r.Prijavljeni_dogadjaj_IdId
JOIN (SELECT Dogadjaj_IdId, MIN(Id) AS MinId FROM Prijavljeni_dogadjaj GROUP BY Dogadjaj_IdId) m ON m.Dogadjaj_IdId = p.Dogadjaj_IdId;
DELETE FROM Prijavljeni_dogadjaj WHERE Id NOT IN (SELECT MIN(Id) FROM Prijavljeni_dogadjaj GROUP BY Dogadjaj_IdId);

-- stare 'nema' / 'bezOpisa' vrednosti su bile zamena za prazan opis
UPDATE Razlog SET Opis = N'' WHERE Opis IN (N'nema', N'bezOpisa');
UPDATE Razlog SET Opis = LEFT(Opis, 500);
UPDATE Razlog SET Razlog_prijave = N'ostalo'
WHERE Razlog_prijave NOT IN (N'nepozeljan', N'nasilje', N'terorizam', N'govor_mrznje', N'lazne_informacije', N'uznemiravanje', N'ostalo');

-- brojac iz razloga; prijave bez ijednog razloga (pad izmedju dva stara zahteva) se brisu
UPDATE Prijavljeni_dogadjaj SET Broj_prijava = (SELECT COUNT(*) FROM Razlog WHERE Prijavljeni_dogadjaj_IdId = Prijavljeni_dogadjaj.Id);
DELETE FROM Prijavljeni_dogadjaj WHERE Broj_prijava = 0;");

            migrationBuilder.DropIndex(
                name: "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId",
                table: "Prijavljeni_dogadjaj");

            migrationBuilder.AlterColumn<string>(
                name: "Razlog_prijave",
                table: "Razlog",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Opis",
                table: "Razlog",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<int>(
                name: "PrijavioId",
                table: "Razlog",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Razlog_PrijavioId_Prijavljeni_dogadjaj_IdId",
                table: "Razlog",
                columns: new[] { "PrijavioId", "Prijavljeni_dogadjaj_IdId" },
                unique: true,
                filter: "[PrijavioId] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Razlog_Razlog_prijave",
                table: "Razlog",
                sql: "[Razlog_prijave] IN (N'nepozeljan', N'nasilje', N'terorizam', N'govor_mrznje', N'lazne_informacije', N'uznemiravanje', N'ostalo')");

            migrationBuilder.CreateIndex(
                name: "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId",
                table: "Prijavljeni_dogadjaj",
                column: "Dogadjaj_IdId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Razlog_Korisnik_PrijavioId",
                table: "Razlog",
                column: "PrijavioId",
                principalTable: "Korisnik",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Razlog_Korisnik_PrijavioId",
                table: "Razlog");

            migrationBuilder.DropIndex(
                name: "IX_Razlog_PrijavioId_Prijavljeni_dogadjaj_IdId",
                table: "Razlog");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Razlog_Razlog_prijave",
                table: "Razlog");

            migrationBuilder.DropIndex(
                name: "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId",
                table: "Prijavljeni_dogadjaj");

            migrationBuilder.DropColumn(
                name: "PrijavioId",
                table: "Razlog");

            migrationBuilder.AlterColumn<string>(
                name: "Razlog_prijave",
                table: "Razlog",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "Opis",
                table: "Razlog",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.CreateIndex(
                name: "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId",
                table: "Prijavljeni_dogadjaj",
                column: "Dogadjaj_IdId");
        }
    }
}
