using MediatR;
using WorldCup.Application.Matches.Queries.GetTodayMatches;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Matches.Queries.GetWorldCupFixture;

public class GetWorldCupFixtureHandler(IMatchRepository matchRepository)
    : IRequestHandler<GetWorldCupFixtureQuery, IEnumerable<MatchDto>>
{
    public async Task<IEnumerable<MatchDto>> Handle(GetWorldCupFixtureQuery request, CancellationToken ct)
    {
        var matches = await matchRepository.GetAllAsync(ct);
        return matches
            .OrderBy(m => m.KickoffUtc)
            .Select(m => new MatchDto(
                m.Id, m.HomeTeam, m.AwayTeam, m.HomeFlagUrl, m.AwayFlagUrl,
                m.Score.HomeGoals, m.Score.AwayGoals,
                m.Status.ToString(), m.KickoffUtc, m.Stage, m.GroupName, m.HomeMinute,
                m.QualifierTeam, m.HomePenalties, m.AwayPenalties));
    }
}
