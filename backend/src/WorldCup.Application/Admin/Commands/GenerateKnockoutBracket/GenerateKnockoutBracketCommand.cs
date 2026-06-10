using MediatR;

namespace WorldCup.Application.Admin.Commands.GenerateKnockoutBracket;

public record GenerateKnockoutBracketCommand : IRequest<int>;
