using FluentValidation;

namespace WorldCup.Application.Auth.Commands.Register;

public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Username).NotEmpty().MinimumLength(3).MaximumLength(30);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}
