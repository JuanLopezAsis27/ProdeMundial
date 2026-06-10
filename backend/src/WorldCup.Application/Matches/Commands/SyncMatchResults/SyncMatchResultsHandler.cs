using MediatR;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;
using WorldCup.Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace WorldCup.Application.Matches.Commands.SyncMatchResults;

public class SyncMatchResultsHandler(
    IMatchRepository matchRepository,
    IFootballApiService footballApiService,
    IUnitOfWork unitOfWork,
    IPublisher publisher,
    ILogger<SyncMatchResultsHandler> logger)
    : IRequestHandler<SyncMatchResultsCommand>
{
    public async Task Handle(SyncMatchResultsCommand request, CancellationToken ct)
    {
        logger.LogInformation("Sincronizando resultados de partidos en vivo...");

        IEnumerable<MatchResultDto> liveMatches;
        try
        {
            liveMatches = await footballApiService.GetLiveMatchesAllLeaguesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Error al obtener partidos en vivo de la API");
            return;
        }

        var liveList = liveMatches.ToList();
        logger.LogInformation("API devolvió {Count} partido(s) en vivo", liveList.Count);

        int updated = 0;
        int notFound = 0;

        foreach (var dto in liveList)
        {
            logger.LogDebug("Procesando partido ExternalId={Id} {Home} vs {Away} Status={Status}",
                dto.ExternalId, dto.HomeTeam, dto.AwayTeam, dto.Status);

            var match = await matchRepository.GetByExternalIdAsync(dto.ExternalId, ct);
            if (match is null)
            {
                logger.LogWarning("Partido ExternalId={Id} no encontrado en DB — ejecutar /api/matches/seed", dto.ExternalId);
                notFound++;
                continue;
            }

            if (dto.Status is "FT" or "AET" or "PEN")
            {
                match.UpdateScore(dto.HomeGoals, dto.AwayGoals);
                // For PEN, goals reflect 90+AET score (tied); qualifier auto-derived from score or left null
                // When tied after AET/PEN, admin must set qualifier manually via simulate endpoint
                match.Finish();
                logger.LogInformation("Partido {Id} finalizado {Home} {HG}-{AG} {Away}",
                    dto.ExternalId, dto.HomeTeam, dto.HomeGoals, dto.AwayGoals, dto.AwayTeam);
            }
            else if (dto.Status is "1H" or "2H" or "ET" or "LIVE")
            {
                match.UpdateScore(dto.HomeGoals, dto.AwayGoals, dto.Minute);
                logger.LogInformation("Partido {Id} en vivo min {Min}: {Home} {HG}-{AG} {Away}",
                    dto.ExternalId, dto.Minute, dto.HomeTeam, dto.HomeGoals, dto.AwayGoals, dto.AwayTeam);
            }

            matchRepository.Update(match);

            foreach (var domainEvent in match.DomainEvents)
                await publisher.Publish(domainEvent, ct);

            match.ClearDomainEvents();
            updated++;
        }

        // Finish matches that were InProgress in DB but are no longer in the live feed
        var liveIds = new HashSet<int>(liveList.Select(l => l.ExternalId));
        var inProgressInDb = (await matchRepository.GetLiveMatchesAsync(ct))
            .Where(m => m.ExternalId.HasValue && !liveIds.Contains(m.ExternalId!.Value))
            .ToList();

        logger.LogInformation("{Count} partido(s) en vivo en DB ya no están en el feed; verificando estado en API", inProgressInDb.Count);

        foreach (var dbMatch in inProgressInDb)
        {
            var result = await footballApiService.GetMatchByExternalIdAsync(dbMatch.ExternalId!.Value, ct);
            if (result is null) continue;

            if (result.Status is "FT" or "AET" or "PEN")
            {
                dbMatch.UpdateScore(result.HomeGoals, result.AwayGoals);
                dbMatch.Finish();
                matchRepository.Update(dbMatch);
                foreach (var domainEvent in dbMatch.DomainEvents)
                    await publisher.Publish(domainEvent, ct);
                dbMatch.ClearDomainEvents();
                updated++;
                logger.LogInformation("Partido {Id} ({Home} vs {Away}) marcado como finalizado tras desaparecer del feed",
                    dbMatch.ExternalId, dbMatch.HomeTeam, dbMatch.AwayTeam);
            }
        }

        await unitOfWork.SaveChangesAsync(ct);
        logger.LogInformation("Sync completado: {Updated} actualizados, {NotFound} no encontrados en DB", updated, notFound);
    }
}
