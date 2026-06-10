using MediatR;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Predictions.Queries.GetUserPredictions;

public class GetUserPredictionsHandler(
    IPredictionRepository predictionRepository,
    IMatchRepository matchRepository,
    ICurrentUserService currentUser)
    : IRequestHandler<GetUserPredictionsQuery, IEnumerable<PredictionDto>>
{
    public async Task<IEnumerable<PredictionDto>> Handle(GetUserPredictionsQuery request, CancellationToken ct)
    {
        var predictions = await predictionRepository.GetByUserAndGroupAsync(currentUser.UserId, request.GroupId, ct);
        var result = new List<PredictionDto>();

        foreach (var p in predictions)
        {
            var match = await matchRepository.GetByIdAsync(p.MatchId, ct);
            if (match is null) continue;

            result.Add(new PredictionDto(
                p.Id, p.MatchId, match.HomeTeam, match.AwayTeam,
                p.PredictedHomeGoals, p.PredictedAwayGoals,
                p.PredictedQualifier,
                p.PointsEarned, p.IsScored,
                match.KickoffUtc, match.Status.ToString(),
                match.Score.HomeGoals, match.Score.AwayGoals));
        }

        return result.OrderByDescending(p => p.MatchKickoff);
    }
}
