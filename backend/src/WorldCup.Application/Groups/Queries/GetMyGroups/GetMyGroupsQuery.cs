using MediatR;

namespace WorldCup.Application.Groups.Queries.GetMyGroups;

public record GetMyGroupsQuery : IRequest<IEnumerable<GroupSummaryDto>>;

public record GroupSummaryDto(
    Guid Id,
    string Name,
    string Code,
    int MemberCount,
    int MyPoints,
    int MyRank
);
