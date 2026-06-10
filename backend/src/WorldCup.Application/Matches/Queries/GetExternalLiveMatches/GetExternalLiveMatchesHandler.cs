using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using WorldCup.Domain.Interfaces.Services;

namespace WorldCup.Application.Matches.Queries.GetExternalLiveMatches;

public class GetExternalLiveMatchesHandler(
    IFootballApiService footballApiService,
    IMemoryCache cache,
    ILogger<GetExternalLiveMatchesHandler> logger)
    : IRequestHandler<GetExternalLiveMatchesQuery, IEnumerable<ExternalLiveMatchDto>>
{
    private const string CacheKey = "external_live_matches";

    public async Task<IEnumerable<ExternalLiveMatchDto>> Handle(
        GetExternalLiveMatchesQuery request, CancellationToken ct)
    {
        if (cache.TryGetValue(CacheKey, out IEnumerable<ExternalLiveMatchDto>? cached) && cached is not null)
        {
            logger.LogDebug("Retornando partidos en vivo desde caché");
            return cached;
        }

        logger.LogInformation("Consultando API: partidos en vivo (todas las ligas)");
        var results = await footballApiService.GetLiveMatchesAllLeaguesAsync(ct);
        var dtos = results.Select(r => new ExternalLiveMatchDto(
            $"ext-{r.ExternalId}",
            r.HomeTeam, r.AwayTeam,
            r.HomeFlagUrl, r.AwayFlagUrl,
            r.HomeGoals, r.AwayGoals,
            MapStatus(r.Status),
            r.KickoffUtc,
            r.Stage, r.GroupName, r.Minute,
            r.LeagueName, r.LeagueCountry
        )).ToList();

        cache.Set(CacheKey, (IEnumerable<ExternalLiveMatchDto>)dtos,
            TimeSpan.FromSeconds(60));

        logger.LogInformation("API devolvió {Count} partidos en vivo (todas las ligas)", dtos.Count);
        return dtos;
    }

    private static string MapStatus(string apiStatus) => apiStatus switch
    {
        "1H" or "2H" or "ET" or "LIVE" or "P" or "BT" => "InProgress",
        "FT" or "AET" or "PEN" => "Finished",
        "HT" => "InProgress",
        _ => "Scheduled"
    };
}
