using System.Text.Json.Serialization;

namespace WorldCup.Infrastructure.ExternalApis.FootballApi.Dtos;

public class FootballApiResponse
{
    [JsonPropertyName("results")]
    public int Results { get; set; }

    [JsonPropertyName("errors")]
    public System.Text.Json.JsonElement? Errors { get; set; }

    [JsonPropertyName("response")]
    public List<FootballApiFixture> Response { get; set; } = [];
}

public class FootballApiFixture
{
    [JsonPropertyName("fixture")]
    public FixtureInfo Fixture { get; set; } = null!;

    [JsonPropertyName("teams")]
    public TeamsInfo Teams { get; set; } = null!;

    [JsonPropertyName("goals")]
    public GoalsInfo Goals { get; set; } = null!;

    [JsonPropertyName("league")]
    public LeagueInfo League { get; set; } = null!;
}

public class FixtureInfo
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("date")]
    public DateTime Date { get; set; }

    [JsonPropertyName("status")]
    public StatusInfo Status { get; set; } = null!;
}

public class StatusInfo
{
    [JsonPropertyName("short")]
    public string Short { get; set; } = string.Empty;

    [JsonPropertyName("elapsed")]
    public int? Elapsed { get; set; }
}

public class TeamsInfo
{
    [JsonPropertyName("home")]
    public TeamInfo Home { get; set; } = null!;

    [JsonPropertyName("away")]
    public TeamInfo Away { get; set; } = null!;
}

public class TeamInfo
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("logo")]
    public string? Logo { get; set; }
}

public class GoalsInfo
{
    [JsonPropertyName("home")]
    public int? Home { get; set; }

    [JsonPropertyName("away")]
    public int? Away { get; set; }
}

public class LeagueInfo
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("country")]
    public string? Country { get; set; }

    [JsonPropertyName("round")]
    public string Round { get; set; } = string.Empty;

    [JsonPropertyName("group")]
    public string? Group { get; set; }
}
