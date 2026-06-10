using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces.Services;

namespace WorldCup.Domain.Services;

public class ScoreCalculator : IScoreCalculator
{
    // Group stage: exact score = 3pts, correct result (winner/draw) = 1pt
    public int Calculate(MatchScore predicted, MatchScore actual)
    {
        if (predicted.HomeGoals == actual.HomeGoals && predicted.AwayGoals == actual.AwayGoals)
            return 3;

        if (predicted.Winner == actual.Winner)
            return 1;

        return 0;
    }

    // Knockout: exact 90-min score = 3pts, correct qualifier (who advances) = 1pt, stackable
    public int CalculateKnockout(MatchScore predictedScore, MatchScore actualScore, string? predictedQualifier, string? actualQualifier)
    {
        int points = 0;

        if (predictedScore.HomeGoals == actualScore.HomeGoals && predictedScore.AwayGoals == actualScore.AwayGoals)
            points += 3;

        if (predictedQualifier is not null && actualQualifier is not null && predictedQualifier == actualQualifier)
            points += 1;

        return points;
    }
}
