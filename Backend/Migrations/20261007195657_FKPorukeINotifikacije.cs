using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class FKPorukeINotifikacije : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "KorisnikKojiReagujeId",
                table: "Notifikacija",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            // Cisti postojece podatke da bi se strani kljucevi mogli dodati:
            // poruke i notifikacije koje pokazuju na nepostojece korisnike/dogadjaje se brisu,
            // a "nepoznat reaguje" (0 ili obrisan korisnik) postaje NULL
            migrationBuilder.Sql(@"
DELETE FROM Poruka WHERE PosiljaocId NOT IN (SELECT Id FROM Korisnik) OR PrimaocId NOT IN (SELECT Id FROM Korisnik);
DELETE FROM Notifikacija WHERE DogadjajId NOT IN (SELECT Id FROM Dogadjaj);
UPDATE Notifikacija SET KorisnikKojiReagujeId = NULL
WHERE KorisnikKojiReagujeId IS NOT NULL AND KorisnikKojiReagujeId NOT IN (SELECT Id FROM Korisnik);");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PosiljaocId",
                table: "Poruka",
                column: "PosiljaocId");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PrimaocId",
                table: "Poruka",
                column: "PrimaocId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_DogadjajId",
                table: "Notifikacija",
                column: "DogadjajId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_KorisnikKojiReagujeId",
                table: "Notifikacija",
                column: "KorisnikKojiReagujeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Dogadjaj_DogadjajId",
                table: "Notifikacija",
                column: "DogadjajId",
                principalTable: "Dogadjaj",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikKojiReagujeId",
                table: "Notifikacija",
                column: "KorisnikKojiReagujeId",
                principalTable: "Korisnik",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Poruka_Korisnik_PosiljaocId",
                table: "Poruka",
                column: "PosiljaocId",
                principalTable: "Korisnik",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Poruka_Korisnik_PrimaocId",
                table: "Poruka",
                column: "PrimaocId",
                principalTable: "Korisnik",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Dogadjaj_DogadjajId",
                table: "Notifikacija");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikKojiReagujeId",
                table: "Notifikacija");

            migrationBuilder.DropForeignKey(
                name: "FK_Poruka_Korisnik_PosiljaocId",
                table: "Poruka");

            migrationBuilder.DropForeignKey(
                name: "FK_Poruka_Korisnik_PrimaocId",
                table: "Poruka");

            migrationBuilder.DropIndex(
                name: "IX_Poruka_PosiljaocId",
                table: "Poruka");

            migrationBuilder.DropIndex(
                name: "IX_Poruka_PrimaocId",
                table: "Poruka");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_DogadjajId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_KorisnikKojiReagujeId",
                table: "Notifikacija");

            migrationBuilder.Sql("UPDATE Notifikacija SET KorisnikKojiReagujeId = 0 WHERE KorisnikKojiReagujeId IS NULL");

            migrationBuilder.AlterColumn<int>(
                name: "KorisnikKojiReagujeId",
                table: "Notifikacija",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
