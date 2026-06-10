using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Aggregates.User;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Auth.Commands.Register;

public class RegisterHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService)
    : IRequestHandler<RegisterCommand, RegisterResult>
{
    public async Task<RegisterResult> Handle(RegisterCommand command, CancellationToken ct)
    {
        var existing = await userRepository.GetByEmailAsync(command.Email, ct);
        if (existing is not null)
            throw new ConflictException("Ya existe una cuenta con ese email.");

        var existingUsername = await userRepository.GetByUsernameAsync(command.Username, ct);
        if (existingUsername is not null)
            throw new ConflictException("Ese nombre de usuario ya está en uso.");

        var hash = passwordHasher.Hash(command.Password);
        var user = User.Create(command.Email, command.Username, hash);

        await userRepository.AddAsync(user, ct);
        await unitOfWork.SaveChangesAsync(ct);

        var token = jwtTokenService.GenerateToken(user.Id, user.Username, user.Email.Value);
        var isAdmin = jwtTokenService.IsAdmin(user.Email.Value);
        return new RegisterResult(user.Id, user.Username, token, isAdmin);
    }
}
