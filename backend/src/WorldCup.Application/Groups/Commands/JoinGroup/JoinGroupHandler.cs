using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Groups.Commands.JoinGroup;

public class JoinGroupHandler(
    IGroupRepository groupRepository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork)
    : IRequestHandler<JoinGroupCommand, Guid>
{
    public async Task<Guid> Handle(JoinGroupCommand command, CancellationToken ct)
    {
        var group = await groupRepository.GetByCodeAsync(command.Code.ToUpperInvariant(), ct)
            ?? throw new NotFoundException("Grupo no encontrado. Verificá el código.");

        if (group.IsMember(currentUser.UserId))
            throw new ConflictException("Ya eres miembro de este grupo.");

        group.AddMember(currentUser.UserId, currentUser.Username);
        groupRepository.Update(group);
        await unitOfWork.SaveChangesAsync(ct);
        return group.Id;
    }
}
