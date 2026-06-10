using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.DeleteUser;

public record DeleteUserCommand(Guid UserId) : IRequest;

public class DeleteUserHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteUserCommand>
{
    public async Task Handle(DeleteUserCommand command, CancellationToken ct)
    {
        var user = await userRepository.GetByIdAsync(command.UserId, ct)
            ?? throw new NotFoundException("Usuario no encontrado.");

        userRepository.Remove(user);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
