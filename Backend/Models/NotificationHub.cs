using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
public class NotificationHub : Hub
{

// Mapiranje korisničkog ID-a na ConnectionId (sigurno za više niti)
    private static readonly ConcurrentDictionary<string, string> _userConnections = new();

    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext != null && httpContext.Request.Query.ContainsKey("userID"))
        {
            Console.WriteLine("User connected: " + httpContext.Request.Query["userID"]);
            string userId = httpContext.Request.Query["userID"];
            Console.WriteLine($"User connected: {userId} with ConnectionId: {Context.ConnectionId}");
            _userConnections[userId] = Context.ConnectionId;
           
        }
        

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userEntry = _userConnections.FirstOrDefault(x => x.Value == Context.ConnectionId);
        if (!string.IsNullOrEmpty(userEntry.Key))
        {
            _userConnections.TryRemove(userEntry.Key, out _);
        }

        await base.OnDisconnectedAsync(exception);
    }




public async Task NotifyNewComment(string userId, string commentText, int eventId)
{
    Console.WriteLine($"Sending notification to {userId}");
    if (_userConnections.TryGetValue(userId, out string connectionId))
    {
        Console.WriteLine($"Found connectionId: {connectionId}");
        await Clients.Client(connectionId).SendAsync("ReceiveNewComment", commentText, eventId);
        Console.WriteLine("Notification sent successfully.");
    }
    else
    {
        Console.WriteLine($"No connection found for userId: {userId}");
    }
}




    public async Task NotifyNewReaction(string userId, string reactionType, int eventId)
    {
        
        if (_userConnections.TryGetValue(userId, out string connectionId))
        {
            Console.WriteLine($"Found connectionId: {connectionId}");
            await Clients.Client(connectionId).SendAsync("ReceiveNewReaction", reactionType, eventId);
            Console.WriteLine("Notification sent successfully.");
        }
        else
        {
            Console.WriteLine($"No connection found for userId: {userId}");
        }
    }


    public async Task NotifyEventReported(string userId, string reason, int eventId)
    {
        if (_userConnections.TryGetValue(userId, out string connectionId))
        {
            Console.WriteLine($"Found connectionId: {connectionId}");
            await Clients.Client(connectionId).SendAsync("ReceiveEventReport", reason, eventId);
            Console.WriteLine("Notification sent successfully.");
        }
        else
        {
            Console.WriteLine($"No connection found for userId: {userId}");
        }
    }
}
