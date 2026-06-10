using Microsoft.AspNetCore.SignalR;
using WorldCup.Application.Common.Interfaces;

namespace WorldCup.Infrastructure.RealTime;

public class SignalRMatchResultsHub(IHubContext<MatchHub> hubContext) : IMatchResultsHub, ILiveMatchNotifier
{
    public Task NotifyScoreUpdated(Guid matchId, int homeGoals, int awayGoals, int? minute)
        => hubContext.Clients.All
            .SendAsync("MatchScoreUpdated", new { matchId, homeGoals, awayGoals, minute });

    public Task NotifyMatchFinished(Guid matchId, int homeGoals, int awayGoals)
        => hubContext.Clients.All
            .SendAsync("MatchFinished", new { matchId, homeGoals, awayGoals });
}

