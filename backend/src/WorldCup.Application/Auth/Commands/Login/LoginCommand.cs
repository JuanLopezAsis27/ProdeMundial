using MediatR;

namespace WorldCup.Application.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;
public record LoginResult(Guid UserId, string Username, string Token, bool IsAdmin);
