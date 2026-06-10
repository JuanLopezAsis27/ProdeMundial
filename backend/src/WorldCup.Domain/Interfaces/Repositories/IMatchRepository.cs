using WorldCup.Domain.Aggregates.Match;

namespace WorldCup.Domain.Interfaces.Repositories;

public interface IMatchRepository
{
    Task<Match?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Match?> GetByExternalIdAsync(int externalId, CancellationToken ct = default);
    Task<IEnumerable<Match>> GetTodayMatchesAsync(CancellationToken ct = default);
    Task<IEnumerable<Match>> GetAllAsync(CancellationToken ct = default);
    Task<IEnumerable<Match>> GetLiveMatchesAsync(CancellationToken ct = default);
    Task AddAsync(Match match, CancellationToken ct = default);
    void Update(Match match);
}
