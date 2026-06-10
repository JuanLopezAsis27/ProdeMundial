using MediatR;

namespace WorldCup.Application.Groups.Commands.JoinGroup;

public record JoinGroupCommand(string Code) : IRequest<Guid>;
