using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class V9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DogadjajId",
                table: "Notifikacija",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DogadjajId",
                table: "Notifikacija");
        }
    }
}
