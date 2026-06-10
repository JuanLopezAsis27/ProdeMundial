using WorldCup.Domain.Events;
using WorldCup.Domain.Exceptions;
using WorldCup.Domain.Shared;

namespace WorldCup.Domain.Aggregates.Match;

public class Match : AggregateRoot
{
    public string HomeTeam { get; private set; } = string.Empty;
    public string AwayTeam { get; private set; } = string.Empty;
    public string? HomeFlagUrl { get; private set; }
    public string? AwayFlagUrl { get; private set; }
    public MatchScore Score { get; private set; } = MatchScore.NotStarted();
    public MatchStatus Status { get; private set; }
    public DateTime KickoffUtc { get; private set; }
    public string Stage { get; private set; } = string.Empty;
    public string? GroupName { get; private set; }
    public int? ExternalId { get; private set; }
    public int? HomeMinute { get; private set; }
    // Team that qualifies to the next round ("home" or "away"); null for group stage / pending matches
    public string? QualifierTeam { get; private set; }
    // Penalty shootout result (informational only, for knockout matches)
    public int? HomePenalties { get; private set; }
    public int? AwayPenalties { get; private set; }

    private Match() { }

    public static Match Create(string homeTeam, string awayTeam, DateTime kickoff, string stage, string? group = null, int? externalId = null, string? homeFlagUrl = null, string? awayFlagUrl = null)
    {
        return new Match
        {
            Id = Guid.NewGuid(),
            HomeTeam = homeTeam,
            AwayTeam = awayTeam,
            HomeFlagUrl = homeFlagUrl,
            AwayFlagUrl = awayFlagUrl,
            Score = MatchScore.NotStarted(),
            Status = MatchStatus.Scheduled,
            KickoffUtc = kickoff,
            Stage = stage,
            GroupName = group,
            ExternalId = externalId
        };
    }

    public void UpdateScore(int homeGoals, int awayGoals, int? minute = null)
    {
        if (Status == MatchStatus.Finished)
            throw new DomainException("No se puede actualizar el marcador de un partido finalizado.");

        Status = MatchStatus.InProgress;
        HomeMinute = minute;
        Score = MatchScore.Create(homeGoals, awayGoals);
        AddDomainEvent(new MatchScoreUpdatedEvent(Id, Score, minute));
    }

    public void Finish(string? qualifierTeam = null)
    {
        if (Status == MatchStatus.Finished) return;
        Status = MatchStatus.Finished;
        HomeMinute = null;

        // Auto-derive qualifier from score if not explicitly provided
        QualifierTeam = qualifierTeam
            ?? (Score.HomeGoals > Score.AwayGoals ? "home"
                : Score.AwayGoals > Score.HomeGoals ? "away"
                : null);

        AddDomainEvent(new MatchFinishedEvent(Id, Score, QualifierTeam, Stage));
    }

    public void ResetToInProgress()
    {
        Status = MatchStatus.InProgress;
        QualifierTeam = null;
        HomePenalties = null;
        AwayPenalties = null;
    }

    public void SetQualifier(string team)
    {
        if (team is not "home" and not "away")
            throw new DomainException("El equipo clasificado debe ser 'home' o 'away'.");
        QualifierTeam = team;
    }

    public void SetPenalties(int homePenalties, int awayPenalties)
    {
        if (homePenalties < 0 || awayPenalties < 0)
            throw new DomainException("Los penales no pueden ser negativos.");
        HomePenalties = homePenalties;
        AwayPenalties = awayPenalties;
    }

    public void UpdateDetails(string homeTeam, string awayTeam, DateTime kickoffUtc, string stage, string? groupName, string? homeFlagUrl, string? awayFlagUrl)
    {
        HomeTeam = homeTeam;
        AwayTeam = awayTeam;
        KickoffUtc = kickoffUtc;
        Stage = stage;
        GroupName = groupName;
        HomeFlagUrl = homeFlagUrl;
        AwayFlagUrl = awayFlagUrl;
    }

    public void Postpone()
    {
        Status = MatchStatus.Postponed;
    }

    public void SetTeams(string homeTeam, string awayTeam, string? homeFlagUrl, string? awayFlagUrl)
    {
        HomeTeam = homeTeam;
        AwayTeam = awayTeam;
        HomeFlagUrl = homeFlagUrl;
        AwayFlagUrl = awayFlagUrl;
    }
}

