using MediatR;

namespace WorldCup.Application.Groups.Queries.GetGroupLeaderboard;

public record GetGroupLeaderboardQuery(Guid GroupId) : IRequest<LeaderboardDto>;

public record LeaderboardDto(Guid GroupId, string GroupName, IEnumerable<LeaderboardEntryDto> Entries);

public record LeaderboardEntryDto(Guid UserId, string Username, int TotalPoints, int Rank);
