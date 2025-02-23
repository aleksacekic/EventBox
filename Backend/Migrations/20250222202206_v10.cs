using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class v10 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Poruka_Chat_Chat_IdId",
                table: "Poruka");

            migrationBuilder.DropTable(
                name: "Chat");

            migrationBuilder.DropIndex(
                name: "IX_Poruka_Chat_IdId",
                table: "Poruka");

            migrationBuilder.DropColumn(
                name: "Pisac_Poruke",
                table: "Poruka");

            migrationBuilder.DropColumn(
                name: "Tekst",
                table: "Poruka");

            migrationBuilder.RenameColumn(
                name: "Chat_IdId",
                table: "Poruka",
                newName: "PrimaocId");

            migrationBuilder.AddColumn<bool>(
                name: "JelProcitano",
                table: "Poruka",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PosiljaocId",
                table: "Poruka",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Sadrzaj",
                table: "Poruka",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "Vreme",
                table: "Poruka",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JelProcitano",
                table: "Poruka");

            migrationBuilder.DropColumn(
                name: "PosiljaocId",
                table: "Poruka");

            migrationBuilder.DropColumn(
                name: "Sadrzaj",
                table: "Poruka");

            migrationBuilder.DropColumn(
                name: "Vreme",
                table: "Poruka");

            migrationBuilder.RenameColumn(
                name: "PrimaocId",
                table: "Poruka",
                newName: "Chat_IdId");

            migrationBuilder.AddColumn<string>(
                name: "Pisac_Poruke",
                table: "Poruka",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Tekst",
                table: "Poruka",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DrugiKorisnikId = table.Column<int>(type: "int", nullable: false),
                    PrviKorisnikId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_Chat_IdId",
                table: "Poruka",
                column: "Chat_IdId");

            migrationBuilder.AddForeignKey(
                name: "FK_Poruka_Chat_Chat_IdId",
                table: "Poruka",
                column: "Chat_IdId",
                principalTable: "Chat",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
