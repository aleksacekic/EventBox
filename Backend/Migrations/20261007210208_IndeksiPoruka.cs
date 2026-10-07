using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class IndeksiPoruka : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Poruka_PosiljaocId",
                table: "Poruka");

            migrationBuilder.DropIndex(
                name: "IX_Poruka_PrimaocId",
                table: "Poruka");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PosiljaocId_PrimaocId",
                table: "Poruka",
                columns: new[] { "PosiljaocId", "PrimaocId" });

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PrimaocId_JelProcitano",
                table: "Poruka",
                columns: new[] { "PrimaocId", "JelProcitano" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Poruka_PosiljaocId_PrimaocId",
                table: "Poruka");

            migrationBuilder.DropIndex(
                name: "IX_Poruka_PrimaocId_JelProcitano",
                table: "Poruka");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PosiljaocId",
                table: "Poruka",
                column: "PosiljaocId");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_PrimaocId",
                table: "Poruka",
                column: "PrimaocId");
        }
    }
}
