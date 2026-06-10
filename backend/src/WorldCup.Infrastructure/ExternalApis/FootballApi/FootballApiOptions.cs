namespace WorldCup.Infrastructure.ExternalApis.FootballApi;

public class FootballApiOptions
{
    public string BaseUrl { get; set; } = "https://v3.football.api-sports.io/";
    public string ApiKey { get; set; } = string.Empty;
    public int LeagueId { get; set; } = 1;
    public int Season { get; set; } = 2026;
}
