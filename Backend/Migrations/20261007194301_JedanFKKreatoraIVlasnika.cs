using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class JedanFKKreatoraIVlasnika : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Prava veza do sada je bila "senka" kolona (KreatorIdId / KorisnikId) pod FK-om; njene
            // vrednosti se prepisuju u kolonu koja ostaje, pa se tek onda senka brise
            migrationBuilder.Sql("UPDATE Dogadjaj SET ID_Kreatora = KreatorIdId");
            migrationBuilder.Sql("UPDATE Notifikacija SET KorisnikCijaJeObjavaId = KorisnikId");

            migrationBuilder.DropForeignKey(
                name: "FK_Dogadjaj_Korisnik_KreatorIdId",
                table: "Dogadjaj");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_KorisnikId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Dogadjaj_KreatorIdId",
                table: "Dogadjaj");

            migrationBuilder.DropColumn(
                name: "KorisnikId",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "KreatorIdId",
                table: "Dogadjaj");

            migrationBuilder.DropColumn(
                name: "SlikaKorisnika",
                table: "Dogadjaj");

            migrationBuilder.DropColumn(
                name: "UserName_Kreatora",
                table: "Dogadjaj");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_KorisnikCijaJeObjavaId",
                table: "Notifikacija",
                column: "KorisnikCijaJeObjavaId");

            migrationBuilder.CreateIndex(
                name: "IX_Dogadjaj_ID_Kreatora",
                table: "Dogadjaj",
                column: "ID_Kreatora");

            migrationBuilder.AddForeignKey(
                name: "FK_Dogadjaj_Korisnik_ID_Kreatora",
                table: "Dogadjaj",
                column: "ID_Kreatora",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikCijaJeObjavaId",
                table: "Notifikacija",
                column: "KorisnikCijaJeObjavaId",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Dogadjaj_Korisnik_ID_Kreatora",
                table: "Dogadjaj");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikCijaJeObjavaId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_KorisnikCijaJeObjavaId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Dogadjaj_ID_Kreatora",
                table: "Dogadjaj");

            migrationBuilder.AddColumn<int>(
                name: "KorisnikId",
                table: "Notifikacija",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "KreatorIdId",
                table: "Dogadjaj",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SlikaKorisnika",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UserName_Kreatora",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Vraca senka kolone i kopije imena/slike kreatora iz tabele Korisnik
            migrationBuilder.Sql(@"
UPDATE d SET KreatorIdId = d.ID_Kreatora, UserName_Kreatora = k.Korisnicko_Ime, SlikaKorisnika = ISNULL(k.KorisnikImage, N'')
FROM Dogadjaj d JOIN Korisnik k ON k.Id = d.ID_Kreatora;
UPDATE Notifikacija SET KorisnikId = KorisnikCijaJeObjavaId;");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_KorisnikId",
                table: "Notifikacija",
                column: "KorisnikId");

            migrationBuilder.CreateIndex(
                name: "IX_Dogadjaj_KreatorIdId",
                table: "Dogadjaj",
                column: "KreatorIdId");

            migrationBuilder.AddForeignKey(
                name: "FK_Dogadjaj_Korisnik_KreatorIdId",
                table: "Dogadjaj",
                column: "KreatorIdId",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikId",
                table: "Notifikacija",
                column: "KorisnikId",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
