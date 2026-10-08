using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class NotifikacijaVezaKomentarReakcija : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "KomentarId",
                table: "Notifikacija",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReakcijaId",
                table: "Notifikacija",
                type: "int",
                nullable: true);

            // Postojece notifikacije: povezi ih sa komentarom/reakcijom od koje su nastale.
            // Komentar: isti dogadjaj, isti autor, isti tekst. Reakcija: isti dogadjaj i korisnik
            // (jedna reakcija po korisniku po dogadjaju) - od vise takvih notifikacija ostaje najnovija.
            // Notifikacije ciji komentar/reakcija vise ne postoje (obrisani ranije) se brisu.
            migrationBuilder.Sql(@"
UPDATE n SET KomentarId = (
    SELECT TOP 1 k.Id FROM Komentar k
    WHERE k.Dogadjaj_IdId = n.DogadjajId AND k.AutorId = n.KorisnikKojiReagujeId AND k.Tekst = n.SadrzajReakcije
    ORDER BY k.Id DESC)
FROM Notifikacija n WHERE n.TipReakcije = N'Komentar';

UPDATE n SET ReakcijaId = r.Id
FROM Notifikacija n JOIN Reakcija r ON r.Dogadjaj_IDId = n.DogadjajId AND r.Korisnik_ID = n.KorisnikKojiReagujeId
WHERE n.TipReakcije = N'Reakcija';

DELETE FROM Notifikacija WHERE TipReakcije = N'Komentar' AND KomentarId IS NULL;
DELETE FROM Notifikacija WHERE TipReakcije = N'Reakcija' AND ReakcijaId IS NULL;
DELETE n FROM Notifikacija n
WHERE n.ReakcijaId IS NOT NULL AND EXISTS (
    SELECT 1 FROM Notifikacija n2 WHERE n2.ReakcijaId = n.ReakcijaId
      AND (n2.Vreme > n.Vreme OR (n2.Vreme = n.Vreme AND n2.Id > n.Id)));

UPDATE n SET SadrzajReakcije = r.Tip
FROM Notifikacija n JOIN Reakcija r ON r.Id = n.ReakcijaId;");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_KomentarId",
                table: "Notifikacija",
                column: "KomentarId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_ReakcijaId",
                table: "Notifikacija",
                column: "ReakcijaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Komentar_KomentarId",
                table: "Notifikacija",
                column: "KomentarId",
                principalTable: "Komentar",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Reakcija_ReakcijaId",
                table: "Notifikacija",
                column: "ReakcijaId",
                principalTable: "Reakcija",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Komentar_KomentarId",
                table: "Notifikacija");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Reakcija_ReakcijaId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_KomentarId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_ReakcijaId",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "KomentarId",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "ReakcijaId",
                table: "Notifikacija");
        }
    }
}
