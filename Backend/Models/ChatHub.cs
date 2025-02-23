using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Threading.Tasks;

public class ChatHub : Hub
{
   private static readonly Dictionary<int, string> _connections = new();
    //key-value parovi korisnik_Id -> ConnectionId

    public override Task OnConnectedAsync()
{
    var httpContext = Context.GetHttpContext();
    if (httpContext.Request.Query.TryGetValue("userID", out var userIdString) && int.TryParse(userIdString, out int userId))
    {
        lock (_connections)
        {
            _connections[userId] = Context.ConnectionId;
        }
        Console.WriteLine($"Korisnik {userId} povezan sa ConnectionId: {Context.ConnectionId}");
    }
    
    return base.OnConnectedAsync();
}

public override Task OnDisconnectedAsync(Exception exception)
{
    var userId = _connections.FirstOrDefault(x => x.Value == Context.ConnectionId).Key;
    if (userId != 0)
    {
        lock (_connections)
        {
            _connections.Remove(userId);
        }
        Console.WriteLine($"Korisnik {userId} se diskonektovao.");
    }
    
    return base.OnDisconnectedAsync(exception);
}

public async Task SendMessage(int senderId, int receiverId, string message)
{
    Console.WriteLine($"Korisnik {senderId} pokušava da pošalje poruku {message} korisniku {receiverId}.");
    if (_connections.TryGetValue(receiverId, out var receiverConnectionId))
    {
        await Clients.Client(receiverConnectionId).SendAsync("ReceiveMessage", senderId, message);
        Console.WriteLine($"Poruka poslata korisniku {receiverId}: {message}");
    }
    else
    {
        Console.WriteLine($"Korisnik {receiverId} nije online.");
    }
}


}

 