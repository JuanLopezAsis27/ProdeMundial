using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.SimulateMatch;

public class SimulateMatchHandler(
    IMatchRepository matchRepository,
    IPredictionRepository predictionRepository,
    IGroupRepository groupRepository,
    IUnitOfWork unitOfWork,
    IPublisher publisher,
    ILogger<SimulateMatchHandler> logger)
    : IRequestHandler<SimulateMatchCommand>
{
    public async Task Handle(SimulateMatchCommand command, CancellationToken ct)
    {
        var match = await matchRepository.GetByIdAsync(command.MatchId, ct)
            ?? throw new NotFoundException("Partido no encontrado.");

        // If already finished, undo the previous scoring so we can re-simulate
        if (match.Status == MatchStatus.Finished)
        {
            logger.LogInformation("Partido {Id} ya estaba finalizado — revirtiendo puntos para re-simular", command.MatchId);

            var existingPredictions = (await predictionRepository.GetByMatchAsync(command.MatchId, ct)).ToList();
            foreach (var p in existingPredictions)
            {
                if (!p.IsScored) continue;

                var oldPoints = p.PointsEarned ?? 0;
                p.ResetScore();
                predictionRepository.Update(p);

                if (oldPoints == 0) continue;
                var group = await groupRepository.GetByIdAsync(p.GroupId, ct);
                var member = group?.GetMember(p.UserId);
                if (member is null) continue;
                member.TotalPoints = Math.Max(0, member.TotalPoints - oldPoints);
                groupRepository.Update(group!);
            }

            match.ResetToInProgress();
            matchRepository.Update(match);
            await unitOfWork.SaveChangesAsync(ct);
        }

        match.UpdateScore(command.HomeGoals, command.AwayGoals);

        if (command.Finish)
        {
            match.Finish(command.Qualifier);

            if (command.HomePenalties.HasValue && command.AwayPenalties.HasValue)
            {
                match.SetPenalties(command.HomePenalties.Value, command.AwayPenalties.Value);
            }

            logger.LogInformation("Admin simuló resultado: {Home} {HG}-{AG} {Away} (FINALIZADO) Qualifier={Q} Pen={HP}-{AP}",
                match.HomeTeam, command.HomeGoals, command.AwayGoals, match.AwayTeam,
                command.Qualifier ?? "auto",
                command.HomePenalties?.ToString() ?? "N/A",
                command.AwayPenalties?.ToString() ?? "N/A");
        }
        else
        {
            logger.LogInformation("Admin simuló parcial: {Home} {HG}-{AG} {Away} (EN VIVO)",
                match.HomeTeam, command.HomeGoals, command.AwayGoals, match.AwayTeam);
        }

        matchRepository.Update(match);

        foreach (var domainEvent in match.DomainEvents)
            await publisher.Publish(domainEvent, ct);

        match.ClearDomainEvents();
        await unitOfWork.SaveChangesAsync(ct);
    }
}
