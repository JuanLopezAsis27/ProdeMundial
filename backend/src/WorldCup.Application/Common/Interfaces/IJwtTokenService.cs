namespace WorldCup.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(Guid userId, string username, string email);
    bool IsAdmin(string email);
}
