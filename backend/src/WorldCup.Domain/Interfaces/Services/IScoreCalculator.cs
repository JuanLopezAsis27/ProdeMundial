using WorldCup.Domain.Aggregates.Match;

namespace WorldCup.Domain.Interfaces.Services;

public interface IScoreCalculator
{
    int Calculate(MatchScore predicted, MatchScore actual);
    int CalculateKnockout(MatchScore predictedScore, MatchScore actualScore, string? predictedQualifier, string? actualQualifier);
}
