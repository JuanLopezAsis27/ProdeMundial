namespace WorldCup.Infrastructure.RealTime;

public interface IMatchResultsHub
{
    Task NotifyScoreUpdated(Guid matchId, int homeGoals, int awayGoals, int? minute);
    Task NotifyMatchFinished(Guid matchId, int homeGoals, int awayGoals);
}
