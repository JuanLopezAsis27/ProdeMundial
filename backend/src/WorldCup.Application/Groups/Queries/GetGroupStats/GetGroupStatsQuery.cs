using MediatR;

namespace WorldCup.Application.Groups.Queries.GetGroupStats;

public record GetGroupStatsQuery(Guid GroupId) : IRequest<GroupStatsDto>;

public record GroupStatsDto(
    List<UserStatsDto> UserStats,
    List<DateSnapshotDto> Evolution
);

public record UserStatsDto(
    Guid UserId,
    string Username,
    int TotalPredictions,
    int ExactPredictions,
    int CorrectOutcomes,
    int WrongPredictions,
    int TotalPoints
);

public record DateSnapshotDto(
    string Date,
    Dictionary<string, int> CumulativePoints
);
