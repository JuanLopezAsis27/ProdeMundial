using WorldCup.Domain.Exceptions;

namespace WorldCup.Domain.Aggregates.Match;

public record MatchScore
{
    public int HomeGoals { get; private set; }
    public int AwayGoals { get; private set; }

    private MatchScore() { }

    private MatchScore(int home, int away)
    {
        HomeGoals = home;
        AwayGoals = away;
    }

    public static MatchScore Create(int home, int away)
    {
        if (home < 0 || away < 0)
            throw new DomainException("Los goles no pueden ser negativos.");
        return new MatchScore(home, away);
    }

    public static MatchScore NotStarted() => new(0, 0);

    public string Winner =>
        HomeGoals > AwayGoals ? "home" :
        AwayGoals > HomeGoals ? "away" : "draw";
}
