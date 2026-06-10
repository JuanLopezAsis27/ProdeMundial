using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;
using WorldCup.Domain.Interfaces.Services;

namespace WorldCup.Application.Matches.Commands.SeedFixture;

public class SeedFixtureHandler(
    IMatchRepository matchRepository,
    IFootballApiService footballApiService,
    IUnitOfWork unitOfWork,
    ILogger<SeedFixtureHandler> logger)
    : IRequestHandler<SeedFixtureCommand, int>
{
    public async Task<int> Handle(SeedFixtureCommand request, CancellationToken ct)
    {
        logger.LogInformation("Iniciando seed del fixture del Mundial 2026...");

        IEnumerable<MatchResultDto> fixtures;
        try
        {
            fixtures = await footballApiService.GetFixtureAsync(2026, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener el fixture de la API de fútbol");
            return 0;
        }

        var fixtureList = fixtures.ToList();
        logger.LogInformation("API devolvió {Count} partidos", fixtureList.Count);

        int added = 0;
        int updated = 0;

        foreach (var dto in fixtureList)
        {
            var existing = await matchRepository.GetByExternalIdAsync(dto.ExternalId, ct);
            if (existing is not null)
            {
                updated++;
                continue;
            }

            var match = Match.Create(
                dto.HomeTeam,
                dto.AwayTeam,
                dto.KickoffUtc,
                dto.Stage,
                dto.GroupName,
                dto.ExternalId,
                dto.HomeFlagUrl,
                dto.AwayFlagUrl
            );

            await matchRepository.AddAsync(match, ct);
            added++;
        }

        await unitOfWork.SaveChangesAsync(ct);
        logger.LogInformation("Seed completado: {Added} partidos nuevos, {Updated} ya existentes", added, updated);

        return added;
    }
}
