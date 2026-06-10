using MediatR;

namespace WorldCup.Application.Predictions.Commands.CreatePrediction;

public record CreatePredictionCommand(Guid MatchId, Guid GroupId, int HomeGoals, int AwayGoals, string? Qualifier = null) : IRequest<Guid>;
