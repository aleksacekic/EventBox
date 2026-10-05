using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class JedinstvenaImenaITokeni : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Postojeci nalozi se NE preimenuju automatski: ako podaci krse nova pravila,
            // migracija staje sa porukom koji nalozi treba rucno srediti
            migrationBuilder.Sql(@"
UPDATE Korisnik SET Korisnicko_Ime = LTRIM(RTRIM(Korisnicko_Ime));
UPDATE Administrator SET Korisnicko_ime = LTRIM(RTRIM(Korisnicko_ime));
IF EXISTS (SELECT 1 FROM Korisnik WHERE LEN(Korisnicko_Ime) > 30)
    OR EXISTS (SELECT 1 FROM Administrator WHERE LEN(Korisnicko_ime) > 30)
    THROW 50001, N'Postoji korisnicko ime duze od 30 karaktera - skrati ga pre migracije.', 1;
IF EXISTS (SELECT Korisnicko_Ime FROM Korisnik GROUP BY Korisnicko_Ime HAVING COUNT(*) > 1)
    OR EXISTS (SELECT Korisnicko_ime FROM Administrator GROUP BY Korisnicko_ime HAVING COUNT(*) > 1)
    THROW 50002, N'Postoje duplikati korisnickih imena - preimenuj ih pre migracije.', 1;");

            // Duplikat tokena nije realan (32 nasumicna bajta), ali zbog starih podataka:
            // takvim nalozima se samo dodeli novi token (korisnik se ponovo prijavi)
            migrationBuilder.Sql(@"
UPDATE k SET Token = LOWER(CONVERT(nvarchar(64), CRYPT_GEN_RANDOM(32), 2)), Validnost = GETDATE()
FROM Korisnik k
WHERE LEN(k.Token) > 64 OR k.Token IN (SELECT Token FROM Korisnik GROUP BY Token HAVING COUNT(*) > 1);
UPDATE Administrator SET Token = NULL, Validnost = NULL
WHERE LEN(Token) > 64 OR Token IN (SELECT Token FROM Administrator WHERE Token IS NOT NULL GROUP BY Token HAVING COUNT(*) > 1);");

            migrationBuilder.AlterColumn<string>(
                name: "Token",
                table: "Korisnik",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Korisnicko_Ime",
                table: "Korisnik",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Token",
                table: "Administrator",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Korisnicko_ime",
                table: "Administrator",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Korisnik_Korisnicko_Ime",
                table: "Korisnik",
                column: "Korisnicko_Ime",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Korisnik_Token",
                table: "Korisnik",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Administrator_Korisnicko_ime",
                table: "Administrator",
                column: "Korisnicko_ime",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Administrator_Token",
                table: "Administrator",
                column: "Token",
                unique: true,
                filter: "[Token] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Korisnik_Korisnicko_Ime",
                table: "Korisnik");

            migrationBuilder.DropIndex(
                name: "IX_Korisnik_Token",
                table: "Korisnik");

            migrationBuilder.DropIndex(
                name: "IX_Administrator_Korisnicko_ime",
                table: "Administrator");

            migrationBuilder.DropIndex(
                name: "IX_Administrator_Token",
                table: "Administrator");

            migrationBuilder.AlterColumn<string>(
                name: "Token",
                table: "Korisnik",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64);

            migrationBuilder.AlterColumn<string>(
                name: "Korisnicko_Ime",
                table: "Korisnik",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "Token",
                table: "Administrator",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Korisnicko_ime",
                table: "Administrator",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);
        }
    }
}
