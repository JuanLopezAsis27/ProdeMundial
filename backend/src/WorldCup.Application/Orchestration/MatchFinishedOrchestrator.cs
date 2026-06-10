using MediatR;
using WorldCup.Domain.Events;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;
using WorldCup.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace WorldCup.Application.Orchestration;

public class MatchFinishedOrchestrator(
    IPredictionRepository predictionRepository,
    IGroupRepository groupRepository,
    IScoreCalculator calculator,
    IUnitOfWork unitOfWork,
    ILogger<MatchFinishedOrchestrator> logger)
    : INotificationHandler<MatchFinishedEvent>
{
    public async Task Handle(MatchFinishedEvent notification, CancellationToken ct)
    {
        logger.LogInformation("Calculando puntos para partido {MatchId}", notification.MatchId);

        var predictions = await predictionRepository.GetByMatchAsync(notification.MatchId, ct);

        foreach (var prediction in predictions)
        {
            prediction.ScorePoints(notification.FinalScore, notification.QualifierTeam, notification.Stage, calculator);
            predictionRepository.Update(prediction);

            var group = await groupRepository.GetByIdAsync(prediction.GroupId, ct);
            if (group is null) continue;

            var member = group.GetMember(prediction.UserId);
            if (member is not null && prediction.PointsEarned.HasValue)
            {
                member.TotalPoints += prediction.PointsEarned.Value;
                groupRepository.Update(group);
            }
        }

        await unitOfWork.SaveChangesAsync(ct);
    }
}
