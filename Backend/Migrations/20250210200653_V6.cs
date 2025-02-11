using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class V6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_Id",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_Korisnik_Id",
                table: "Notifikacija");

            migrationBuilder.RenameColumn(
                name: "TipNotifikacije",
                table: "Notifikacija",
                newName: "TipReakcije");

            migrationBuilder.RenameColumn(
                name: "Sadrzaj",
                table: "Notifikacija",
                newName: "SadrzajReakcije");

            migrationBuilder.RenameColumn(
                name: "Korisnik_Id",
                table: "Notifikacija",
                newName: "KorisnikKojiReagujeId");

            migrationBuilder.AddColumn<int>(
                name: "KorisnikCijiJeDogadjajId",
                table: "Notifikacija",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "KorisnikId",
                table: "Notifikacija",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_KorisnikId",
                table: "Notifikacija",
                column: "KorisnikId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikId",
                table: "Notifikacija",
                column: "KorisnikId",
                principalTable: "Korisnik",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_KorisnikId",
                table: "Notifikacija");

            migrationBuilder.DropIndex(
                name: "IX_Notifikacija_KorisnikId",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "KorisnikCijiJeDogadjajId",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "KorisnikId",
                table: "Notifikacija");

            migrationBuilder.RenameColumn(
                name: "TipReakcije",
                table: "Notifikacija",
                newName: "TipNotifikacije");

            migrationBuilder.RenameColumn(
                name: "SadrzajReakcije",
                table: "Notifikacija",
                newName: "Sadrzaj");

            migrationBuilder.RenameColumn(
                name: "KorisnikKojiReagujeId",
                table: "Notifikacija",
                newName: "Korisnik_Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_Korisnik_Id",
                table: "Notifikacija",
                column: "Korisnik_Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_Id",
                table: "Notifikacija",
                column: "Korisnik_Id",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
