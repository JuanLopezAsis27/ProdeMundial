using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.SetPenalties;

public class SetPenaltiesHandler(
    IMatchRepository matchRepository,
    IUnitOfWork unitOfWork,
    ILogger<SetPenaltiesHandler> logger)
    : IRequestHandler<SetPenaltiesCommand>
{
    public async Task Handle(SetPenaltiesCommand command, CancellationToken ct)
    {
        var match = await matchRepository.GetByIdAsync(command.MatchId, ct)
            ?? throw new NotFoundException("Partido no encontrado.");

        match.SetPenalties(command.HomePenalties, command.AwayPenalties);
        matchRepository.Update(match);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Admin seteó penales {Home} ({HP}) - ({AP}) {Away}",
            match.HomeTeam, command.HomePenalties, command.AwayPenalties, match.AwayTeam);
    }
}
