namespace WorldCup.Domain.Interfaces.Services;

public interface IFootballApiService
{
    Task<IEnumerable<MatchResultDto>> GetLiveMatchesAsync(CancellationToken ct = default);
    Task<IEnumerable<MatchResultDto>> GetLiveMatchesAllLeaguesAsync(CancellationToken ct = default);
    Task<IEnumerable<MatchResultDto>> GetFixtureAsync(int season, CancellationToken ct = default);
    Task<IEnumerable<MatchResultDto>> GetMatchesByDateAsync(DateTime date, CancellationToken ct = default);
    Task<IEnumerable<MatchResultDto>> GetFixturesByDateAllLeaguesAsync(DateTime date, CancellationToken ct = default);
    Task<MatchResultDto?> GetMatchByExternalIdAsync(int externalId, CancellationToken ct = default);
}

public record MatchResultDto(
    int ExternalId,
    string HomeTeam,
    string AwayTeam,
    string? HomeFlagUrl,
    string? AwayFlagUrl,
    int HomeGoals,
    int AwayGoals,
    string Status,
    DateTime KickoffUtc,
    string Stage,
    string? GroupName,
    int? Minute,
    string? LeagueName = null,
    string? LeagueCountry = null
);
