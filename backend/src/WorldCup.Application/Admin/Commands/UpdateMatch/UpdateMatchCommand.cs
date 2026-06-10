using MediatR;

namespace WorldCup.Application.Admin.Commands.UpdateMatch;

public record UpdateMatchCommand(
    Guid MatchId,
    string HomeTeam,
    string AwayTeam,
    DateTime KickoffUtc,
    string Stage,
    string? GroupName = null,
    string? HomeFlagUrl = null,
    string? AwayFlagUrl = null
) : IRequest;
