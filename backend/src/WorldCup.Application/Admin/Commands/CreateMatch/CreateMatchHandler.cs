using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.CreateMatch;

public class CreateMatchHandler(
    IMatchRepository matchRepository,
    IUnitOfWork unitOfWork,
    ILogger<CreateMatchHandler> logger)
    : IRequestHandler<CreateMatchCommand, Guid>
{
    public async Task<Guid> Handle(CreateMatchCommand command, CancellationToken ct)
    {
        var match = Match.Create(
            command.HomeTeam,
            command.AwayTeam,
            command.KickoffUtc,
            command.Stage,
            command.GroupName,
            homeFlagUrl: command.HomeFlagUrl,
            awayFlagUrl: command.AwayFlagUrl);

        await matchRepository.AddAsync(match, ct);
        await unitOfWork.SaveChangesAsync(ct);

        logger.LogInformation("Admin creó partido: {Home} vs {Away} — {Stage} ({Kickoff})",
            command.HomeTeam, command.AwayTeam, command.Stage, command.KickoffUtc);

        return match.Id;
    }
}
