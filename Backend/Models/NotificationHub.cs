using Microsoft.AspNetCore.SignalR;

public class NotificationHub : Hub
{
    public async Task SendNotification(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }


    public async Task NotifyNewComment(string userId, string commentText, int eventId)
    {
        Console.WriteLine("POZIV IZ");
        Console.WriteLine("User ID: " + userId);
        Console.WriteLine("Comment text: " + commentText);
        Console.WriteLine("Event ID: " + eventId);
        
        await Clients.User(userId).SendAsync("ReceiveNewComment", commentText, eventId);
    }


    public async Task NotifyNewReaction(string userId, string reactionType, int eventId)
    {
        await Clients.User(userId).SendAsync("ReceiveNewReaction", reactionType, eventId);
    }


    public async Task NotifyEventReported(string userId, string reason, int eventId)
    {
        await Clients.User(userId).SendAsync("ReceiveEventReport", reason, eventId);
    }
}
