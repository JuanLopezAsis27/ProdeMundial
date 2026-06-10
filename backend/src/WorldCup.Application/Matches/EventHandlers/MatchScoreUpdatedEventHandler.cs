using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Events;

namespace WorldCup.Application.Matches.EventHandlers;

public class MatchScoreUpdatedEventHandler(
    ILiveMatchNotifier notifier,
    ILogger<MatchScoreUpdatedEventHandler> logger)
    : INotificationHandler<MatchScoreUpdatedEvent>
{
    public async Task Handle(MatchScoreUpdatedEvent notification, CancellationToken ct)
    {
        logger.LogInformation("Notificando score en vivo para partido {MatchId}: {Home}-{Away} min {Min}",
            notification.MatchId, notification.Score.HomeGoals, notification.Score.AwayGoals, notification.Minute);

        await notifier.NotifyScoreUpdated(
            notification.MatchId,
            notification.Score.HomeGoals,
            notification.Score.AwayGoals,
            notification.Minute);
    }
}
