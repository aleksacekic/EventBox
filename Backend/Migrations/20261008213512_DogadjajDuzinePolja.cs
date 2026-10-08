using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class DogadjajDuzinePolja : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Postojeci podaci moraju da stanu u nove duzine kolona; kategorija van liste postaje Ostalo
            migrationBuilder.Sql(@"
UPDATE Dogadjaj SET Naslov = LEFT(LTRIM(RTRIM(Naslov)), 100), Opis = LEFT(ISNULL(Opis, N''), 1000), Vreme_pocetka = LEFT(Vreme_pocetka, 5);
UPDATE Dogadjaj SET Kategorija = N'Ostalo'
WHERE Kategorija NOT IN (N'Ostalo', N'Zurka', N'Humanitarna akcija', N'Ekoloska akcija', N'Sportski dogadjaj', N'Koncert');");

            migrationBuilder.AlterColumn<string>(
                name: "Vreme_pocetka",
                table: "Dogadjaj",
                type: "nvarchar(5)",
                maxLength: 5,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Opis",
                table: "Dogadjaj",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Naslov",
                table: "Dogadjaj",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Kategorija",
                table: "Dogadjaj",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Vreme_pocetka",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(5)",
                oldMaxLength: 5);

            migrationBuilder.AlterColumn<string>(
                name: "Opis",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AlterColumn<string>(
                name: "Naslov",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<string>(
                name: "Kategorija",
                table: "Dogadjaj",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);
        }
    }
}
