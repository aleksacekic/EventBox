using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class ReakcijaKorisnikJedinstvena : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Ciscenje postojecih podataka da bi ogranicenja mogla da se dodaju:
            // reakcije nepostojecih korisnika, nepoznati tipovi i duplikati (ostaje najnovija)
            migrationBuilder.Sql(@"
DELETE FROM Reakcija WHERE Korisnik_ID NOT IN (SELECT Id FROM Korisnik);
DELETE FROM Reakcija WHERE Tip NOT IN (N'Zainteresovan', N'Mozda', N'Nezainteresovan');
DELETE r FROM Reakcija r WHERE EXISTS (
    SELECT 1 FROM Reakcija r2
    WHERE r2.Korisnik_ID = r.Korisnik_ID AND r2.Dogadjaj_IDId = r.Dogadjaj_IDId AND r2.Id > r.Id);");

            migrationBuilder.AlterColumn<string>(
                name: "Tip",
                table: "Reakcija",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Reakcija_Korisnik_ID_Dogadjaj_IDId",
                table: "Reakcija",
                columns: new[] { "Korisnik_ID", "Dogadjaj_IDId" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Reakcija_Tip",
                table: "Reakcija",
                sql: "[Tip] IN (N'Zainteresovan', N'Mozda', N'Nezainteresovan')");

            migrationBuilder.AddForeignKey(
                name: "FK_Reakcija_Korisnik_Korisnik_ID",
                table: "Reakcija",
                column: "Korisnik_ID",
                principalTable: "Korisnik",
                principalColumn: "Id");

            // Brojaci na dogadjajima od sada uvek odgovaraju stvarnim reakcijama
            migrationBuilder.Sql(@"
UPDATE d SET
    Broj_Zainteresovanih   = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Zainteresovan'),
    Broj_Mozda             = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Mozda'),
    Broj_Nezainteresovanih = (SELECT COUNT(*) FROM Reakcija r WHERE r.Dogadjaj_IDId = d.Id AND r.Tip = N'Nezainteresovan')
FROM Dogadjaj d;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reakcija_Korisnik_Korisnik_ID",
                table: "Reakcija");

            migrationBuilder.DropIndex(
                name: "IX_Reakcija_Korisnik_ID_Dogadjaj_IDId",
                table: "Reakcija");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Reakcija_Tip",
                table: "Reakcija");

            migrationBuilder.AlterColumn<string>(
                name: "Tip",
                table: "Reakcija",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);
        }
    }
}
