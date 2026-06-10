using MediatR;

namespace WorldCup.Application.Matches.Commands.SeedFixture;

public record SeedFixtureCommand : IRequest<int>;
