using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventBoxApi.Migrations
{
    /// <inheritdoc />
    public partial class v1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Administrator",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Prezime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email_adresa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Korisnicko_ime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lozinka = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Administrator", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Chat",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrviKorisnikId = table.Column<int>(type: "int", nullable: false),
                    DrugiKorisnikId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chat", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Korisnik",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Ime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Prezime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Korisnicko_Ime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lozinka = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Lozinka_Hashirana = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Datum_rodjenja = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Email_Adresa = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Blokiran = table.Column<int>(type: "int", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Validnost = table.Column<DateTime>(type: "datetime2", nullable: false),
                    KorisnikImage = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Korisnik", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Poruka",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Chat_IdId = table.Column<int>(type: "int", nullable: false),
                    Pisac_Poruke = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tekst = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Poruka", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Poruka_Chat_Chat_IdId",
                        column: x => x.Chat_IdId,
                        principalTable: "Chat",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Dogadjaj",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    KreatorIdId = table.Column<int>(type: "int", nullable: false),
                    ID_Kreatora = table.Column<int>(type: "int", nullable: false),
                    UserName_Kreatora = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Datum_Objave = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SlikaKorisnika = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Naslov = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Datum_Dogadjaja = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Vreme_pocetka = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Opis = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Broj_Zainteresovanih = table.Column<int>(type: "int", nullable: false),
                    Broj_Mozda = table.Column<int>(type: "int", nullable: false),
                    Broj_Nezainteresovanih = table.Column<int>(type: "int", nullable: false),
                    Kategorija = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    DogadjajImage = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Dogadjaj", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Dogadjaj_Korisnik_KreatorIdId",
                        column: x => x.KreatorIdId,
                        principalTable: "Korisnik",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifikacija",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Poruka = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Vreme = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Korisnik_IdId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifikacija", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifikacija_Korisnik_Korisnik_IdId",
                        column: x => x.Korisnik_IdId,
                        principalTable: "Korisnik",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Komentar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tekst = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Username_Korisnika = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Dogadjaj_IdId = table.Column<int>(type: "int", nullable: false),
                    SlikaKorisnika = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Komentar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Komentar_Dogadjaj_Dogadjaj_IdId",
                        column: x => x.Dogadjaj_IdId,
                        principalTable: "Dogadjaj",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Prijavljeni_dogadjaj",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Dogadjaj_IdId = table.Column<int>(type: "int", nullable: false),
                    Broj_prijava = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Prijavljeni_dogadjaj", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Prijavljeni_dogadjaj_Dogadjaj_Dogadjaj_IdId",
                        column: x => x.Dogadjaj_IdId,
                        principalTable: "Dogadjaj",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reakcija",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Tip = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Korisnik_ID = table.Column<int>(type: "int", nullable: false),
                    Dogadjaj_IDId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reakcija", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reakcija_Dogadjaj_Dogadjaj_IDId",
                        column: x => x.Dogadjaj_IDId,
                        principalTable: "Dogadjaj",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Razlog",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Prijavljeni_dogadjaj_IdId = table.Column<int>(type: "int", nullable: false),
                    Razlog_prijave = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Opis = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Razlog", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Razlog_Prijavljeni_dogadjaj_Prijavljeni_dogadjaj_IdId",
                        column: x => x.Prijavljeni_dogadjaj_IdId,
                        principalTable: "Prijavljeni_dogadjaj",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Dogadjaj_KreatorIdId",
                table: "Dogadjaj",
                column: "KreatorIdId");

            migrationBuilder.CreateIndex(
                name: "IX_Komentar_Dogadjaj_IdId",
                table: "Komentar",
                column: "Dogadjaj_IdId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifikacija_Korisnik_IdId",
                table: "Notifikacija",
                column: "Korisnik_IdId");

            migrationBuilder.CreateIndex(
                name: "IX_Poruka_Chat_IdId",
                table: "Poruka",
                column: "Chat_IdId");

            migrationBuilder.CreateIndex(
                name: "IX_Prijavljeni_dogadjaj_Dogadjaj_IdId",
                table: "Prijavljeni_dogadjaj",
                column: "Dogadjaj_IdId");

            migrationBuilder.CreateIndex(
                name: "IX_Razlog_Prijavljeni_dogadjaj_IdId",
                table: "Razlog",
                column: "Prijavljeni_dogadjaj_IdId");

            migrationBuilder.CreateIndex(
                name: "IX_Reakcija_Dogadjaj_IDId",
                table: "Reakcija",
                column: "Dogadjaj_IDId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Administrator");

            migrationBuilder.DropTable(
                name: "Komentar");

            migrationBuilder.DropTable(
                name: "Notifikacija");

            migrationBuilder.DropTable(
                name: "Poruka");

            migrationBuilder.DropTable(
                name: "Razlog");

            migrationBuilder.DropTable(
                name: "Reakcija");

            migrationBuilder.DropTable(
                name: "Chat");

            migrationBuilder.DropTable(
                name: "Prijavljeni_dogadjaj");

            migrationBuilder.DropTable(
                name: "Dogadjaj");

            migrationBuilder.DropTable(
                name: "Korisnik");
        }
    }
}
