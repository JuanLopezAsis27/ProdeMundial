using MediatR;

namespace WorldCup.Application.Predictions.Commands.UpdatePrediction;

public record UpdatePredictionCommand(Guid PredictionId, int HomeGoals, int AwayGoals, string? Qualifier = null) : IRequest;
