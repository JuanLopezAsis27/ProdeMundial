using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WorldCup.Domain.Interfaces.Services;
using WorldCup.Infrastructure.ExternalApis.FootballApi.Dtos;

namespace WorldCup.Infrastructure.ExternalApis.FootballApi;

public class FootballApiService(
    HttpClient httpClient,
    IOptions<FootballApiOptions> options,
    ILogger<FootballApiService> logger)
    : IFootballApiService
{
    private readonly FootballApiOptions _options = options.Value;

    public async Task<IEnumerable<MatchResultDto>> GetLiveMatchesAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>(
                $"fixtures?live=all&league={_options.LeagueId}&season={_options.Season}", ct);
            return response?.Response?.Select(MapToDto) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener partidos en vivo");
            return [];
        }
    }

    public async Task<IEnumerable<MatchResultDto>> GetLiveMatchesAllLeaguesAsync(CancellationToken ct = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>("fixtures?live=all", ct);
            return response?.Response?.Select(MapToDto) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener partidos en vivo (todas las ligas)");
            return [];
        }
    }

    public async Task<IEnumerable<MatchResultDto>> GetFixtureAsync(int season, CancellationToken ct = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>(
                $"fixtures?league={_options.LeagueId}&season={season}", ct);
            if (response?.Results == 0)
                logger.LogWarning("API devolvió 0 resultados para fixture {Season}. Errors: {Errors}", season, response.Errors?.ToString() ?? "none");
            return response?.Response?.Select(MapToDto) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener fixture de la temporada {Season}", season);
            return [];
        }
    }

    public async Task<IEnumerable<MatchResultDto>> GetMatchesByDateAsync(DateTime date, CancellationToken ct = default)
    {
        try
        {
            var dateStr = date.ToString("yyyy-MM-dd");
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>(
                $"fixtures?league={_options.LeagueId}&season={_options.Season}&date={dateStr}", ct);
            return response?.Response?.Select(MapToDto) ?? [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener partidos para {Date}", date);
            return [];
        }
    }

    public async Task<IEnumerable<MatchResultDto>> GetFixturesByDateAllLeaguesAsync(DateTime date, CancellationToken ct = default)
    {
        try
        {
            var dateStr = date.ToString("yyyy-MM-dd");
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>(
                $"fixtures?date={dateStr}&timezone=UTC", ct);
            var results = response?.Response?.Select(MapToDto).ToList() ?? [];
            if (response?.Results == 0)
                logger.LogWarning("API devolvió 0 resultados para {Date}. Errors: {Errors}", dateStr, response.Errors?.ToString() ?? "none");
            logger.LogInformation("API devolvió {Count} partidos para {Date} (todos los torneos)", results.Count, dateStr);
            return results.Take(50);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener partidos de hoy desde la API");
            return [];
        }
    }

    public async Task<MatchResultDto?> GetMatchByExternalIdAsync(int externalId, CancellationToken ct = default)
    {
        try
        {
            var response = await httpClient.GetFromJsonAsync<FootballApiResponse>($"fixtures?id={externalId}", ct);
            var fixture = response?.Response?.FirstOrDefault();
            return fixture is null ? null : MapToDto(fixture);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error al obtener partido ExternalId={Id}", externalId);
            return null;
        }
    }

    private static MatchResultDto MapToDto(FootballApiFixture fixture)
    {
        var round = fixture.League?.Round ?? string.Empty;
        var stage = round.Contains("Group") ? "Group Stage" :
                    round.Contains("Round of 16") ? "Round of 16" :
                    round.Contains("Quarter") ? "Quarter-finals" :
                    round.Contains("Semi") ? "Semi-finals" :
                    round.Contains("Final") ? "Final" : round;

        return new MatchResultDto(
            fixture.Fixture.Id,
            fixture.Teams.Home.Name,
            fixture.Teams.Away.Name,
            fixture.Teams.Home.Logo,
            fixture.Teams.Away.Logo,
            fixture.Goals.Home ?? 0,
            fixture.Goals.Away ?? 0,
            fixture.Fixture.Status.Short,
            DateTime.SpecifyKind(fixture.Fixture.Date.ToUniversalTime(), DateTimeKind.Utc),
            stage,
            fixture.League?.Group,
            fixture.Fixture.Status.Elapsed,
            fixture.League?.Name,
            fixture.League?.Country
        );
    }
}
