namespace WorldCup.Application.Common.Interfaces;

public interface ILiveMatchNotifier
{
    Task NotifyScoreUpdated(Guid matchId, int homeGoals, int awayGoals, int? minute);
    Task NotifyMatchFinished(Guid matchId, int homeGoals, int awayGoals);
}
