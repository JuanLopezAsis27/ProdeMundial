using Microsoft.EntityFrameworkCore;
using WorldCup.Domain.Aggregates.Group;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Infrastructure.Persistence.Repositories;

public class GroupRepository(AppDbContext context) : IGroupRepository
{
    public Task<Group?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Id == id, ct);

    public Task<Group?> GetByCodeAsync(string code, CancellationToken ct = default)
        => context.Groups.Include(g => g.Members).FirstOrDefaultAsync(g => g.Code == code, ct);

    public async Task<IEnumerable<Group>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await context.Groups
            .Include(g => g.Members)
            .Where(g => g.Members.Any(m => m.UserId == userId))
            .ToListAsync(ct);

    public async Task<IEnumerable<Group>> GetAllAsync(CancellationToken ct = default)
        => await context.Groups.Include(g => g.Members).OrderBy(g => g.Name).ToListAsync(ct);

    public async Task AddAsync(Group group, CancellationToken ct = default)
        => await context.Groups.AddAsync(group, ct);

    public void Update(Group group)
        => context.Groups.Update(group);

    public void Remove(Group group)
        => context.Groups.Remove(group);
}
