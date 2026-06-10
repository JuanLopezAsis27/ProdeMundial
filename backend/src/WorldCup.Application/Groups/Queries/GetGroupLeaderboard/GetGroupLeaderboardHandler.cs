using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Groups.Queries.GetGroupLeaderboard;

public class GetGroupLeaderboardHandler(IGroupRepository groupRepository)
    : IRequestHandler<GetGroupLeaderboardQuery, LeaderboardDto>
{
    public async Task<LeaderboardDto> Handle(GetGroupLeaderboardQuery request, CancellationToken ct)
    {
        var group = await groupRepository.GetByIdAsync(request.GroupId, ct)
            ?? throw new NotFoundException("Grupo no encontrado.");

        var entries = group.Members
            .OrderByDescending(m => m.TotalPoints)
            .Select((m, i) => new LeaderboardEntryDto(m.UserId, m.Username, m.TotalPoints, i + 1))
            .ToList();

        return new LeaderboardDto(group.Id, group.Name, entries);
    }
}
