using Microsoft.EntityFrameworkCore;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Infrastructure.Persistence.Repositories;

public class MatchRepository(AppDbContext context) : IMatchRepository
{
    public Task<Match?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Matches.FirstOrDefaultAsync(m => m.Id == id, ct);

    public Task<Match?> GetByExternalIdAsync(int externalId, CancellationToken ct = default)
        => context.Matches.FirstOrDefaultAsync(m => m.ExternalId == externalId, ct);

    public async Task<IEnumerable<Match>> GetTodayMatchesAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        return await context.Matches
            .Where(m => m.KickoffUtc >= today && m.KickoffUtc < tomorrow)
            .OrderBy(m => m.KickoffUtc)
            .ToListAsync(ct);
    }

    public async Task<IEnumerable<Match>> GetAllAsync(CancellationToken ct = default)
        => await context.Matches.OrderBy(m => m.KickoffUtc).ToListAsync(ct);

    public async Task<IEnumerable<Match>> GetLiveMatchesAsync(CancellationToken ct = default)
        => await context.Matches
            .Where(m => m.Status == MatchStatus.InProgress)
            .ToListAsync(ct);

    public async Task AddAsync(Match match, CancellationToken ct = default)
        => await context.Matches.AddAsync(match, ct);

    public void Update(Match match)
        => context.Matches.Update(match);
}
