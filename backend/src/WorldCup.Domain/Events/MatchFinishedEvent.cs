using MediatR;
using WorldCup.Domain.Aggregates.Match;

namespace WorldCup.Domain.Events;

public record MatchFinishedEvent(Guid MatchId, MatchScore FinalScore, string? QualifierTeam, string Stage) : INotification;
