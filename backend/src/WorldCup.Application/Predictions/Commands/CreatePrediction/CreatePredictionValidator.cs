using FluentValidation;

namespace WorldCup.Application.Predictions.Commands.CreatePrediction;

public class CreatePredictionValidator : AbstractValidator<CreatePredictionCommand>
{
    public CreatePredictionValidator()
    {
        RuleFor(x => x.MatchId).NotEmpty();
        RuleFor(x => x.GroupId).NotEmpty();
        RuleFor(x => x.HomeGoals).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AwayGoals).GreaterThanOrEqualTo(0);
    }
}
