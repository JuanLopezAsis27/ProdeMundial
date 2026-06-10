using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Groups.Queries.GetGroupStats;

public class GetGroupStatsHandler(
    IGroupRepository groupRepository,
    IPredictionRepository predictionRepository,
    IMatchRepository matchRepository)
    : IRequestHandler<GetGroupStatsQuery, GroupStatsDto>
{
    public async Task<GroupStatsDto> Handle(GetGroupStatsQuery request, CancellationToken ct)
    {
        var group = await groupRepository.GetByIdAsync(request.GroupId, ct)
            ?? throw new NotFoundException("Grupo no encontrado.");

        var allPredictions = (await predictionRepository.GetByGroupAsync(request.GroupId, ct)).ToList();

        var memberMap = group.Members.ToDictionary(m => m.UserId);

        // Per-user stats
        var userStats = new List<UserStatsDto>();
        foreach (var userGroup in allPredictions.GroupBy(p => p.UserId))
        {
            if (!memberMap.TryGetValue(userGroup.Key, out var member)) continue;

            var scored = userGroup.Where(p => p.IsScored).ToList();
            userStats.Add(new UserStatsDto(
                userGroup.Key,
                member.Username,
                userGroup.Count(),
                scored.Count(p => p.PointsEarned == 3),
                scored.Count(p => p.PointsEarned >= 1),
                scored.Count(p => p.PointsEarned == 0),
                member.TotalPoints
            ));
        }

        // Add members with 0 predictions
        foreach (var m in group.Members)
        {
            if (!userStats.Any(u => u.UserId == m.UserId))
                userStats.Add(new UserStatsDto(m.UserId, m.Username, 0, 0, 0, 0, m.TotalPoints));
        }

        // Leaderboard evolution: compute cumulative points per user over match dates
        var scoredPreds = allPredictions.Where(p => p.IsScored).ToList();
        var matchKickoffs = new Dictionary<Guid, DateTime>();

        foreach (var p in scoredPreds)
        {
            if (!matchKickoffs.ContainsKey(p.MatchId))
            {
                var match = await matchRepository.GetByIdAsync(p.MatchId, ct);
                if (match is not null)
                    matchKickoffs[p.MatchId] = match.KickoffUtc;
            }
        }

        var byDate = scoredPreds
            .Where(p => matchKickoffs.ContainsKey(p.MatchId))
            .GroupBy(p => matchKickoffs[p.MatchId].ToString("yyyy-MM-dd"))
            .OrderBy(g => g.Key)
            .ToList();

        var evolution = new List<DateSnapshotDto>();
        var cumulative = group.Members.ToDictionary(m => m.UserId.ToString(), _ => 0);

        foreach (var dateGroup in byDate)
        {
            foreach (var pred in dateGroup)
            {
                var key = pred.UserId.ToString();
                if (cumulative.ContainsKey(key))
                    cumulative[key] += pred.PointsEarned ?? 0;
            }
            evolution.Add(new DateSnapshotDto(dateGroup.Key, new Dictionary<string, int>(cumulative)));
        }

        return new GroupStatsDto(
            userStats.OrderByDescending(u => u.TotalPoints).ToList(),
            evolution
        );
    }
}
