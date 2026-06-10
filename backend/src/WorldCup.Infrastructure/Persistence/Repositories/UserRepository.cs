using Microsoft.EntityFrameworkCore;
using WorldCup.Domain.Aggregates.User;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Infrastructure.Persistence.Repositories;

public class UserRepository(AppDbContext context) : IUserRepository
{
    public Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => context.Users.FirstOrDefaultAsync(u => u.Email.Value == email.ToLowerInvariant(), ct);

    public Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default)
        => context.Users.FirstOrDefaultAsync(u => u.Username == username, ct);

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken ct = default)
        => await context.Users.OrderBy(u => u.Username).ToListAsync(ct);

    public async Task AddAsync(User user, CancellationToken ct = default)
        => await context.Users.AddAsync(user, ct);

    public void Remove(User user)
        => context.Users.Remove(user);
}
