using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.DeleteGroup;

public record DeleteGroupCommand(Guid GroupId) : IRequest;

public class DeleteGroupHandler(IGroupRepository groupRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteGroupCommand>
{
    public async Task Handle(DeleteGroupCommand command, CancellationToken ct)
    {
        var group = await groupRepository.GetByIdAsync(command.GroupId, ct)
            ?? throw new NotFoundException("Grupo no encontrado.");

        groupRepository.Remove(group);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
