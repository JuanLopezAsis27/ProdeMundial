using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Auth.Commands.Login;

public class LoginHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService)
    : IRequestHandler<LoginCommand, LoginResult>
{
    public async Task<LoginResult> Handle(LoginCommand command, CancellationToken ct)
    {
        var user = await userRepository.GetByEmailAsync(command.Email, ct)
            ?? throw new NotFoundException("Credenciales inválidas.");

        if (!passwordHasher.Verify(command.Password, user.PasswordHash))
            throw new ForbiddenException("Credenciales inválidas.");

        var token = jwtTokenService.GenerateToken(user.Id, user.Username, user.Email.Value);
        var isAdmin = jwtTokenService.IsAdmin(user.Email.Value);
        return new LoginResult(user.Id, user.Username, token, isAdmin);
    }
}
