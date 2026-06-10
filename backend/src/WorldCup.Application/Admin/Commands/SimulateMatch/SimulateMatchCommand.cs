using MediatR;

namespace WorldCup.Application.Admin.Commands.SimulateMatch;

public record SimulateMatchCommand(Guid MatchId, int HomeGoals, int AwayGoals, bool Finish = true, string? Qualifier = null, int? HomePenalties = null, int? AwayPenalties = null) : IRequest;

