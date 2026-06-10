using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;
using WorldCup.Domain.Interfaces.Services;
using WorldCup.Infrastructure.BackgroundJobs;
using WorldCup.Infrastructure.ExternalApis.FootballApi;
using WorldCup.Infrastructure.Persistence;
using WorldCup.Infrastructure.Persistence.Repositories;
using WorldCup.Infrastructure.RealTime;
using WorldCup.Infrastructure.Security;
using WorldCup.Infrastructure.Seeding;

namespace WorldCup.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // EF Core
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("Default")));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Repositories
        services.AddScoped<IMatchRepository, MatchRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<IPredictionRepository, PredictionRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Security
        services.Configure<JwtOptions>(configuration.GetSection("Jwt"));
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();

        // Football API
        services.Configure<FootballApiOptions>(configuration.GetSection("FootballApi"));
        services.AddHttpClient<IFootballApiService, FootballApiService>(client =>
        {
            var apiOptions = configuration.GetSection("FootballApi").Get<FootballApiOptions>() ?? new();
            client.BaseAddress = new Uri(apiOptions.BaseUrl);
            client.DefaultRequestHeaders.Add("x-apisports-key", apiOptions.ApiKey);
        });

        // Redis
        var redisConn = configuration["Redis:ConnectionString"] ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(_ => ConnectionMultiplexer.Connect(redisConn));

        // SignalR hub abstraction
        services.AddScoped<SignalRMatchResultsHub>();
        services.AddScoped<IMatchResultsHub>(sp => sp.GetRequiredService<SignalRMatchResultsHub>());
        services.AddScoped<ILiveMatchNotifier>(sp => sp.GetRequiredService<SignalRMatchResultsHub>());

        // Seeding
        services.AddScoped<MockDataSeeder>();

        // Background job
        services.AddHostedService<SyncMatchResultsJob>();

        return services;
    }
}
