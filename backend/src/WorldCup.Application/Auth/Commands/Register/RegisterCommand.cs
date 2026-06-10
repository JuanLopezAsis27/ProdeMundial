using MediatR;

namespace WorldCup.Application.Auth.Commands.Register;

public record RegisterCommand(string Email, string Username, string Password) : IRequest<RegisterResult>;
public record RegisterResult(Guid UserId, string Username, string Token, bool IsAdmin);
