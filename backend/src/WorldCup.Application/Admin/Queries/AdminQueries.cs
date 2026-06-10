using MediatR;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Queries;

public record UserAdminDto(Guid Id, string Username, string Email, DateTime CreatedAt);
public record GroupAdminDto(Guid Id, string Name, string Code, int MemberCount, DateTime CreatedAt);

// --- Users ---

public record GetAllUsersQuery : IRequest<IEnumerable<UserAdminDto>>;

public class GetAllUsersHandler(IUserRepository userRepository)
    : IRequestHandler<GetAllUsersQuery, IEnumerable<UserAdminDto>>
{
    public async Task<IEnumerable<UserAdminDto>> Handle(GetAllUsersQuery request, CancellationToken ct)
    {
        var users = await userRepository.GetAllAsync(ct);
        return users.Select(u => new UserAdminDto(u.Id, u.Username, u.Email.Value, u.CreatedAt));
    }
}

// --- Groups ---

public record GetAllGroupsQuery : IRequest<IEnumerable<GroupAdminDto>>;

public class GetAllGroupsHandler(IGroupRepository groupRepository)
    : IRequestHandler<GetAllGroupsQuery, IEnumerable<GroupAdminDto>>
{
    public async Task<IEnumerable<GroupAdminDto>> Handle(GetAllGroupsQuery request, CancellationToken ct)
    {
        var groups = await groupRepository.GetAllAsync(ct);
        return groups.Select(g => new GroupAdminDto(g.Id, g.Name, g.Code, g.Members.Count, g.CreatedAt));
    }
}
