using MediatR;

namespace WorldCup.Application.Predictions.Queries.GetUserPredictions;

public record GetUserPredictionsQuery(Guid GroupId) : IRequest<IEnumerable<PredictionDto>>;

public record PredictionDto(
    Guid Id,
    Guid MatchId,
    string HomeTeam,
    string AwayTeam,
    int PredictedHome,
    int PredictedAway,
    string? PredictedQualifier,
    int? PointsEarned,
    bool IsScored,
    DateTime MatchKickoff,
    string MatchStatus,
    int ActualHome,
    int ActualAway
);
