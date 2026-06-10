using MediatR;

namespace WorldCup.Application.Matches.Queries.GetExternalLiveMatches;

public record GetExternalLiveMatchesQuery : IRequest<IEnumerable<ExternalLiveMatchDto>>;

public record ExternalLiveMatchDto(
    string Id,
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
    string? League,
    string? Country
);
