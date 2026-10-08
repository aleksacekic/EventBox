using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class NotifikacijeTipovi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Notifikacije je ranije upisivao klijent, pa je TipReakcije bio cas tip reakcije, cas tekst
            // komentara, cas 'Dogadjaj je prijavljen'. Sada: TipReakcije = Reakcija | Komentar | Prijava,
            // a SadrzajReakcije = tip reakcije / tekst komentara / razlog prijave.
            migrationBuilder.Sql(@"
UPDATE Notifikacija SET TipReakcije = N'Prijava', SadrzajReakcije = N''
WHERE TipReakcije = N'Dogadjaj je prijavljen';
UPDATE Notifikacija SET SadrzajReakcije = TipReakcije, TipReakcije = N'Reakcija'
WHERE TipReakcije IN (N'Zainteresovan', N'Mozda', N'Nezainteresovan');
UPDATE Notifikacija SET SadrzajReakcije = TipReakcije, TipReakcije = N'Komentar'
WHERE TipReakcije NOT IN (N'Reakcija', N'Komentar', N'Prijava');");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
