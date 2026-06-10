using MediatR;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Groups.Queries.GetMyGroups;

public class GetMyGroupsHandler(IGroupRepository groupRepository, ICurrentUserService currentUser)
    : IRequestHandler<GetMyGroupsQuery, IEnumerable<GroupSummaryDto>>
{
    public async Task<IEnumerable<GroupSummaryDto>> Handle(GetMyGroupsQuery request, CancellationToken ct)
    {
        var groups = await groupRepository.GetByUserIdAsync(currentUser.UserId, ct);
        return groups.Select(g =>
        {
            var sortedMembers = g.Members.OrderByDescending(m => m.TotalPoints).ToList();
            var myMember = g.GetMember(currentUser.UserId);
            var myRank = myMember is null ? 0 : sortedMembers.IndexOf(myMember) + 1;

            return new GroupSummaryDto(
                g.Id, g.Name, g.Code,
                g.Members.Count,
                myMember?.TotalPoints ?? 0,
                myRank);
        });
    }
}
