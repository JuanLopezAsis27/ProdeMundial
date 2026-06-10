namespace WorldCup.Domain.Aggregates.Group;

public class GroupMember
{
    public Guid GroupId { get; private set; }
    public Guid UserId { get; private set; }
    public string Username { get; private set; } = string.Empty;
    public DateTime JoinedAt { get; private set; }
    public int TotalPoints { get; set; }

    private GroupMember() { }

    public static GroupMember Create(Guid groupId, Guid userId, string username)
    {
        return new GroupMember
        {
            GroupId = groupId,
            UserId = userId,
            Username = username,
            JoinedAt = DateTime.UtcNow,
            TotalPoints = 0
        };
    }
}
