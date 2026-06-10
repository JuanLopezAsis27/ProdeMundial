using WorldCup.Domain.Aggregates.Group;

namespace WorldCup.Domain.Interfaces.Repositories;

public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Group?> GetByCodeAsync(string code, CancellationToken ct = default);
    Task<IEnumerable<Group>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<IEnumerable<Group>> GetAllAsync(CancellationToken ct = default);
    Task AddAsync(Group group, CancellationToken ct = default);
    void Update(Group group);
    void Remove(Group group);
}
