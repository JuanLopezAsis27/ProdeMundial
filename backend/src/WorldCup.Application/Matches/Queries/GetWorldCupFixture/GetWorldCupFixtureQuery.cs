using MediatR;
using WorldCup.Application.Matches.Queries.GetTodayMatches;

namespace WorldCup.Application.Matches.Queries.GetWorldCupFixture;

public record GetWorldCupFixtureQuery : IRequest<IEnumerable<MatchDto>>;
