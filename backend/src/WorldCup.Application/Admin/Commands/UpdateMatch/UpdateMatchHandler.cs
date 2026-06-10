using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.UpdateMatch;

public class UpdateMatchHandler(
    IMatchRepository matchRepository,
    IUnitOfWork unitOfWork,
    ILogger<UpdateMatchHandler> logger)
    : IRequestHandler<UpdateMatchCommand>
{
    public async Task Handle(UpdateMatchCommand command, CancellationToken ct)
    {
        var match = await matchRepository.GetByIdAsync(command.MatchId, ct)
            ?? throw new NotFoundException("Partido no encontrado.");

        match.UpdateDetails(
            command.HomeTeam,
            command.AwayTeam,
            command.KickoffUtc,
            command.Stage,
            command.GroupName,
            command.HomeFlagUrl,
            command.AwayFlagUrl);

        matchRepository.Update(match);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Admin editó partido {Id}: {Home} vs {Away} — {Stage}",
            command.MatchId, command.HomeTeam, command.AwayTeam, command.Stage);
    }
}
