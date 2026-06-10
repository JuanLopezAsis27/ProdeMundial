using MediatR;

namespace WorldCup.Application.Admin.Commands.CreateMatch;

public record CreateMatchCommand(
    string HomeTeam,
    string AwayTeam,
    DateTime KickoffUtc,
    string Stage,
    string? GroupName = null,
    string? HomeFlagUrl = null,
    string? AwayFlagUrl = null
) : IRequest<Guid>;
