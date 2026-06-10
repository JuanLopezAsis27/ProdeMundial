using MediatR;

namespace WorldCup.Application.Groups.Commands.CreateGroup;

public record CreateGroupCommand(string Name) : IRequest<CreateGroupResult>;
public record CreateGroupResult(Guid GroupId, string Name, string Code);
