using MediatR;

namespace WorldCup.Application.Admin.Commands.SetPenalties;

public record SetPenaltiesCommand(Guid MatchId, int HomePenalties, int AwayPenalties) : IRequest;
