using MediatR;

namespace WorldCup.Application.Matches.Queries.GetTodayMatches;

public record GetTodayMatchesQuery : IRequest<IEnumerable<MatchDto>>;

public record MatchDto(
    Guid Id,
    string HomeTeam,
    string AwayTeam,
    string? HomeFlagUrl,
    string? AwayFlagUrl,
    int HomeGoals,
    int AwayGoals,
    string Status,
    DateTime KickoffUtc,
    string Stage,
    string? GroupName,
    int? Minute,
    string? QualifierTeam = null,
    int? HomePenalties = null,
    int? AwayPenalties = null
);
