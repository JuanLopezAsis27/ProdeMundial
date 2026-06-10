using Microsoft.EntityFrameworkCore;
using WorldCup.Domain.Aggregates.Prediction;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Infrastructure.Persistence.Repositories;

public class PredictionRepository(AppDbContext context) : IPredictionRepository
{
    public Task<Prediction?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Predictions.FirstOrDefaultAsync(p => p.Id == id, ct);

    public Task<Prediction?> GetByUserMatchGroupAsync(Guid userId, Guid matchId, Guid groupId, CancellationToken ct = default)
        => context.Predictions.FirstOrDefaultAsync(
            p => p.UserId == userId && p.MatchId == matchId && p.GroupId == groupId, ct);

    public async Task<IEnumerable<Prediction>> GetByMatchAsync(Guid matchId, CancellationToken ct = default)
        => await context.Predictions.Where(p => p.MatchId == matchId).ToListAsync(ct);

    public async Task<IEnumerable<Prediction>> GetByUserAndGroupAsync(Guid userId, Guid groupId, CancellationToken ct = default)
        => await context.Predictions
            .Where(p => p.UserId == userId && p.GroupId == groupId)
            .ToListAsync(ct);

    public async Task<IEnumerable<Prediction>> GetByGroupAsync(Guid groupId, CancellationToken ct = default)
        => await context.Predictions
            .Where(p => p.GroupId == groupId)
            .ToListAsync(ct);

    public async Task AddAsync(Prediction prediction, CancellationToken ct = default)
        => await context.Predictions.AddAsync(prediction, ct);

    public void Update(Prediction prediction)
        => context.Predictions.Update(prediction);
}
