using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class V5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_IdId",
                table: "Notifikacija");

            migrationBuilder.RenameColumn(
                name: "Poruka",
                table: "Notifikacija",
                newName: "TipNotifikacije");

            migrationBuilder.RenameColumn(
                name: "Korisnik_IdId",
                table: "Notifikacija",
                newName: "Korisnik_Id");

            migrationBuilder.RenameIndex(
                name: "IX_Notifikacija_Korisnik_IdId",
                table: "Notifikacija",
                newName: "IX_Notifikacija_Korisnik_Id");

            migrationBuilder.AddColumn<string>(
                name: "Sadrzaj",
                table: "Notifikacija",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_Id",
                table: "Notifikacija",
                column: "Korisnik_Id",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_Id",
                table: "Notifikacija");

            migrationBuilder.DropColumn(
                name: "Sadrzaj",
                table: "Notifikacija");

            migrationBuilder.RenameColumn(
                name: "TipNotifikacije",
                table: "Notifikacija",
                newName: "Poruka");

            migrationBuilder.RenameColumn(
                name: "Korisnik_Id",
                table: "Notifikacija",
                newName: "Korisnik_IdId");

            migrationBuilder.RenameIndex(
                name: "IX_Notifikacija_Korisnik_Id",
                table: "Notifikacija",
                newName: "IX_Notifikacija_Korisnik_IdId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifikacija_Korisnik_Korisnik_IdId",
                table: "Notifikacija",
                column: "Korisnik_IdId",
                principalTable: "Korisnik",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
