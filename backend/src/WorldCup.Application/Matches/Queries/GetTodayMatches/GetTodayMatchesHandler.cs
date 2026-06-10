using MediatR;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Matches.Queries.GetTodayMatches;

public class GetTodayMatchesHandler(IMatchRepository matchRepository)
    : IRequestHandler<GetTodayMatchesQuery, IEnumerable<MatchDto>>
{
    public async Task<IEnumerable<MatchDto>> Handle(GetTodayMatchesQuery request, CancellationToken ct)
    {
        var matches = await matchRepository.GetTodayMatchesAsync(ct);
        return matches.Select(m => new MatchDto(
            m.Id, m.HomeTeam, m.AwayTeam, m.HomeFlagUrl, m.AwayFlagUrl,
            m.Score.HomeGoals, m.Score.AwayGoals,
            m.Status.ToString(), m.KickoffUtc, m.Stage, m.GroupName, m.HomeMinute,
            m.QualifierTeam, m.HomePenalties, m.AwayPenalties));
    }
}
