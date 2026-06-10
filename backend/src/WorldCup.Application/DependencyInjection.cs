using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using WorldCup.Application.Common.Behaviors;
using WorldCup.Domain.Interfaces.Services;
using WorldCup.Domain.Services;

namespace WorldCup.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddScoped<IScoreCalculator, ScoreCalculator>();

        return services;
    }
}
