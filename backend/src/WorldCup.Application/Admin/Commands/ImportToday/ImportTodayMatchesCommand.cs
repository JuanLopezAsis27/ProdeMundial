using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;
using WorldCup.Domain.Interfaces.Services;

namespace WorldCup.Application.Admin.Commands.ImportToday;

public record ImportTodayMatchesCommand : IRequest<int>;

public class ImportTodayMatchesHandler(
    IMatchRepository matchRepository,
    IFootballApiService footballApiService,
    IUnitOfWork unitOfWork,
    ILogger<ImportTodayMatchesHandler> logger)
    : IRequestHandler<ImportTodayMatchesCommand, int>
{
    private static readonly string FlagBase = "https://flagcdn.com/w80";
    private static string Flag(string code) => $"{FlagBase}/{code}.png";

    public async Task<int> Handle(ImportTodayMatchesCommand request, CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        logger.LogInformation("Importando partidos para {Date}...", today.ToString("yyyy-MM-dd"));

        var fixtures = (await footballApiService.GetFixturesByDateAllLeaguesAsync(today, ct)).ToList();

        if (fixtures.Count > 0)
        {
            logger.LogInformation("API devolvió {Count} partidos para hoy", fixtures.Count);
            return await ImportFromApiAsync(fixtures, ct);
        }

        logger.LogWarning("API no devolvió partidos para hoy, creando partidos de prueba...");
        return await CreateTestMatchesAsync(ct);
    }

    private async Task<int> ImportFromApiAsync(IList<MatchResultDto> fixtures, CancellationToken ct)
    {
        int added = 0;
        foreach (var dto in fixtures)
        {
            var existing = await matchRepository.GetByExternalIdAsync(dto.ExternalId, ct);
            if (existing is not null) continue;

            var match = Match.Create(
                dto.HomeTeam, dto.AwayTeam, dto.KickoffUtc,
                dto.Stage, dto.GroupName, dto.ExternalId,
                dto.HomeFlagUrl, dto.AwayFlagUrl);

            await matchRepository.AddAsync(match, ct);
            added++;
        }

        await unitOfWork.SaveChangesAsync(ct);
        logger.LogInformation("{Count} partidos de hoy importados desde la API", added);
        return added;
    }

    private async Task<int> CreateTestMatchesAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var base_ = now.Date;

        var testMatches = new[]
        {
            ("France",      "England",   "fr",    "gb-eng", base_.AddHours(18)),
            ("Brazil",      "Argentina", "br",    "ar",     base_.AddHours(20)),
            ("Germany",     "Spain",     "de",    "es",     base_.AddHours(21)),
            ("Italy",       "Portugal",  "it",    "pt",     base_.AddHours(22)),
            ("Netherlands", "Belgium",   "nl",    "be",     base_.AddHours(23)),
        };

        int added = 0;
        foreach (var (home, away, homeCode, awayCode, kickoff) in testMatches)
        {
            // Skip if kickoff already passed
            if (kickoff <= now) continue;

            var match = Match.Create(
                home, away, kickoff, "Friendly", null, null,
                Flag(homeCode), Flag(awayCode));
            await matchRepository.AddAsync(match, ct);
            added++;
        }

        await unitOfWork.SaveChangesAsync(ct);
        logger.LogInformation("{Count} partidos de prueba creados para hoy", added);
        return added;
    }
}
