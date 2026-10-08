using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

// Jedna SignalR konekcija po prijavljenom korisniku (/notificationHub), za sve sto server
// salje uzivo: notifikacije ("NovaNotifikacija") i poruke u cetu ("NovaPoruka").
//
// Klijent se prijavljuje istim tokenom kao za API (accessTokenFactory u JS klijentu salje
// ?access_token=..., vidi TokenAuthenticationHandler). Ko je korisnik, SignalR cita iz tokena
// (claim NameIdentifier), pa Clients.User("5") stize samo do korisnika 5 - nikad po ID-u koji
// klijent sam posalje.
//
// Hub nema metoda koje klijent poziva: sve se salje sa servera (Models/Obavestenja.cs), posle
// upisa u bazu. Zato nema ni poruka "u tudje ime", ni notifikacija koje se izgube kad je
// primalac offline.
[Authorize]
public class NotificationHub : Hub
{
}
