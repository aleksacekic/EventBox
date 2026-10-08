using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class EmailJedinstvenISesijeUtc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Sesije su do sada cuvane u lokalnom vremenu servera, od sada u UTC: postojece
            // Validnost se pomera za trenutnu razliku lokalno-UTC (inace bi sesije trajale sat-dva duze)
            migrationBuilder.Sql(@"
DECLARE @pomak int = DATEDIFF(minute, GETUTCDATE(), GETDATE());
UPDATE Korisnik SET Validnost = DATEADD(minute, -@pomak, Validnost);
UPDATE Administrator SET Validnost = DATEADD(minute, -@pomak, Validnost) WHERE Validnost IS NOT NULL;");

            // Email: razmaci sa krajeva; duplikati se NE spajaju automatski - migracija staje sa porukom
            migrationBuilder.Sql(@"
UPDATE Korisnik SET Email_Adresa = LTRIM(RTRIM(Email_Adresa));
IF EXISTS (SELECT 1 FROM Korisnik WHERE LEN(Email_Adresa) > 254)
    THROW 50003, N'Postoji email adresa duza od 254 karaktera - ispravi je pre migracije.', 1;
IF EXISTS (SELECT Email_Adresa FROM Korisnik GROUP BY Email_Adresa HAVING COUNT(*) > 1)
    THROW 50004, N'Vise naloga ima istu email adresu - ispravi ih pre migracije.', 1;");

            migrationBuilder.AlterColumn<string>(
                name: "Email_Adresa",
                table: "Korisnik",
                type: "nvarchar(254)",
                maxLength: 254,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Korisnik_Email_Adresa",
                table: "Korisnik",
                column: "Email_Adresa",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DECLARE @pomak int = DATEDIFF(minute, GETUTCDATE(), GETDATE());
UPDATE Korisnik SET Validnost = DATEADD(minute, @pomak, Validnost);
UPDATE Administrator SET Validnost = DATEADD(minute, @pomak, Validnost) WHERE Validnost IS NOT NULL;");

            migrationBuilder.DropIndex(
                name: "IX_Korisnik_Email_Adresa",
                table: "Korisnik");

            migrationBuilder.AlterColumn<string>(
                name: "Email_Adresa",
                table: "Korisnik",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(254)",
                oldMaxLength: 254);
        }
    }
}
