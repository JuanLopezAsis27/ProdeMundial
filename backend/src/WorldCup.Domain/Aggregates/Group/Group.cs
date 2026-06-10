using WorldCup.Domain.Exceptions;
using WorldCup.Domain.Shared;

namespace WorldCup.Domain.Aggregates.Group;

public class Group : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string Code { get; private set; } = string.Empty;
    public Guid OwnerId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private readonly List<GroupMember> _members = [];
    public IReadOnlyList<GroupMember> Members => _members.AsReadOnly();

    private Group() { }

    public static Group Create(string name, Guid ownerId, string ownerUsername)
    {
        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Code = GenerateCode(),
            OwnerId = ownerId,
            CreatedAt = DateTime.UtcNow
        };
        group._members.Add(GroupMember.Create(group.Id, ownerId, ownerUsername));
        return group;
    }

    public void AddMember(Guid userId, string username)
    {
        if (_members.Count >= 50)
            throw new GroupFullException("El grupo está lleno (máximo 50 miembros).");

        if (IsMember(userId))
            throw new DomainException("El usuario ya es miembro del grupo.");

        _members.Add(GroupMember.Create(Id, userId, username));
    }

    public bool IsMember(Guid userId) =>
        _members.Any(m => m.UserId == userId);

    public GroupMember? GetMember(Guid userId) =>
        _members.FirstOrDefault(m => m.UserId == userId);

    private static string GenerateCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 6).Select(s => s[random.Next(s.Length)]).ToArray());
    }
}
