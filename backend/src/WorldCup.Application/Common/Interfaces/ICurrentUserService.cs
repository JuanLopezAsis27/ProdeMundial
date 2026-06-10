namespace WorldCup.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid UserId { get; }
    string Username { get; }
}
