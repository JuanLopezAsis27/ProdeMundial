using MediatR;
using WorldCup.Domain.Aggregates.Match;

namespace WorldCup.Domain.Events;

public record MatchScoreUpdatedEvent(Guid MatchId, MatchScore Score, int? Minute) : INotification;
