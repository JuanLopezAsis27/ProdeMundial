using WorldCup.Domain.Shared;

namespace WorldCup.Domain.Aggregates.User;

public class User : AggregateRoot
{
    public Email Email { get; private set; } = null!;
    public string Username { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private User() { }

    public static User Create(string email, string username, string passwordHash)
    {
        return new User
        {
            Id = Guid.NewGuid(),
            Email = Email.Create(email),
            Username = username.Trim(),
            PasswordHash = passwordHash,
            CreatedAt = DateTime.UtcNow
        };
    }
}
