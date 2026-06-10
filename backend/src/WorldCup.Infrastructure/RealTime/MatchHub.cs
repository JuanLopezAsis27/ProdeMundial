using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace WorldCup.Infrastructure.RealTime;

[Authorize]
public class MatchHub : Hub
{
    public async Task SubscribeToMatch(string matchId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"match-{matchId}");

    public async Task UnsubscribeFromMatch(string matchId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"match-{matchId}");
}
