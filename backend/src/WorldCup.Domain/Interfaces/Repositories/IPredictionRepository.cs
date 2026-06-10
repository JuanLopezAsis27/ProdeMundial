using WorldCup.Domain.Aggregates.Prediction;

namespace WorldCup.Domain.Interfaces.Repositories;

public interface IPredictionRepository
{
    Task<Prediction?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Prediction?> GetByUserMatchGroupAsync(Guid userId, Guid matchId, Guid groupId, CancellationToken ct = default);
    Task<IEnumerable<Prediction>> GetByMatchAsync(Guid matchId, CancellationToken ct = default);
    Task<IEnumerable<Prediction>> GetByUserAndGroupAsync(Guid userId, Guid groupId, CancellationToken ct = default);
    Task<IEnumerable<Prediction>> GetByGroupAsync(Guid groupId, CancellationToken ct = default);
    Task AddAsync(Prediction prediction, CancellationToken ct = default);
    void Update(Prediction prediction);
}
