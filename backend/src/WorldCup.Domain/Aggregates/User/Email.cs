using WorldCup.Domain.Exceptions;

namespace WorldCup.Domain.Aggregates.User;

public record Email
{
    public string Value { get; }

    private Email(string value) => Value = value;

    public static Email Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new DomainException("Email inválido.");
        return new Email(email.Trim().ToLowerInvariant());
    }

    public override string ToString() => Value;
}
