using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Events;
using WorldCup.Domain.Exceptions;
using WorldCup.Domain.Interfaces.Services;
using WorldCup.Domain.Shared;

namespace WorldCup.Domain.Aggregates.Prediction;

public class Prediction : AggregateRoot
{
    public Guid UserId { get; private set; }
    public Guid MatchId { get; private set; }
    public Guid GroupId { get; private set; }
    public int PredictedHomeGoals { get; private set; }
    public int PredictedAwayGoals { get; private set; }
    // "home" or "away" — only used for knockout matches (draw → penalties)
    public string? PredictedQualifier { get; private set; }
    public int? PointsEarned { get; private set; }
    public bool IsScored { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Prediction() { }

    public static Prediction Create(Guid userId, Guid matchId, Guid groupId, int homeGoals, int awayGoals, DateTime matchKickoff, string? qualifier = null)
    {
        if (DateTime.UtcNow >= matchKickoff)
            throw new PredictionDeadlinePassedException("El partido ya comenzó. No se pueden hacer predicciones.");

        if (homeGoals < 0 || awayGoals < 0)
            throw new DomainException("Los goles predichos no pueden ser negativos.");

        return new Prediction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            MatchId = matchId,
            GroupId = groupId,
            PredictedHomeGoals = homeGoals,
            PredictedAwayGoals = awayGoals,
            PredictedQualifier = qualifier,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(int homeGoals, int awayGoals, DateTime matchKickoff, string? qualifier = null)
    {
        if (DateTime.UtcNow >= matchKickoff)
            throw new PredictionDeadlinePassedException("El partido ya comenzó. No se pueden modificar predicciones.");

        PredictedHomeGoals = homeGoals;
        PredictedAwayGoals = awayGoals;
        PredictedQualifier = qualifier;
    }

    public void ScorePoints(MatchScore finalScore, string? actualQualifier, string stage, IScoreCalculator calculator)
    {
        if (IsScored) return;

        var predicted = MatchScore.Create(PredictedHomeGoals, PredictedAwayGoals);
        bool isKnockout = stage is "Round of 32" or "Round of 16" or "Quarter-finals"
                                or "Semi-finals" or "Final" or "Third Place";

        PointsEarned = isKnockout
            ? calculator.CalculateKnockout(predicted, finalScore, PredictedQualifier, actualQualifier)
            : calculator.Calculate(predicted, finalScore);

        IsScored = true;
        AddDomainEvent(new PredictionScoredEvent(Id, UserId, GroupId, PointsEarned.Value));
    }

    public void ResetScore()
    {
        IsScored = false;
        PointsEarned = null;
    }
}

