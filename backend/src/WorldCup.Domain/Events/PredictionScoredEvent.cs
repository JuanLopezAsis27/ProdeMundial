using MediatR;

namespace WorldCup.Domain.Events;

public record PredictionScoredEvent(Guid PredictionId, Guid UserId, Guid GroupId, int PointsEarned) : INotification;
