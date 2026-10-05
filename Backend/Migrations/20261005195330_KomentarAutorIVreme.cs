using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class KomentarAutorIVreme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SlikaKorisnika",
                table: "Komentar");

            migrationBuilder.DropColumn(
                name: "Username_Korisnika",
                table: "Komentar");

            migrationBuilder.AddColumn<int>(
                name: "AutorId",
                table: "Komentar",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "Vreme",
                table: "Komentar",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Komentar_AutorId",
                table: "Komentar",
                column: "AutorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Komentar_Korisnik_AutorId",
                table: "Komentar",
                column: "AutorId",
                principalTable: "Korisnik",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Komentar_Korisnik_AutorId",
                table: "Komentar");

            migrationBuilder.DropIndex(
                name: "IX_Komentar_AutorId",
                table: "Komentar");

            migrationBuilder.DropColumn(
                name: "AutorId",
                table: "Komentar");

            migrationBuilder.DropColumn(
                name: "Vreme",
                table: "Komentar");

            migrationBuilder.AddColumn<string>(
                name: "SlikaKorisnika",
                table: "Komentar",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Username_Korisnika",
                table: "Komentar",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
