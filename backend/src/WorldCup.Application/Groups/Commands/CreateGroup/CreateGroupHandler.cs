using MediatR;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Aggregates.Group;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Groups.Commands.CreateGroup;

public class CreateGroupHandler(
    IGroupRepository groupRepository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreateGroupCommand, CreateGroupResult>
{
    public async Task<CreateGroupResult> Handle(CreateGroupCommand command, CancellationToken ct)
    {
        var group = Group.Create(command.Name, currentUser.UserId, currentUser.Username);
        await groupRepository.AddAsync(group, ct);
        await unitOfWork.SaveChangesAsync(ct);
        return new CreateGroupResult(group.Id, group.Name, group.Code);
    }
}
