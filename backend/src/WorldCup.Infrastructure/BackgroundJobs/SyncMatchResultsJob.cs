using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Matches.Commands.SyncMatchResults;

namespace WorldCup.Infrastructure.BackgroundJobs;

public class SyncMatchResultsJob(IServiceProvider serviceProvider, ILogger<SyncMatchResultsJob> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Job de sincronización iniciado");

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(10));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
                await mediator.Send(new SyncMatchResultsCommand(), stoppingToken);
                logger.LogInformation("Sincronización completada: {Time}", DateTimeOffset.UtcNow);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error en sincronización de partidos");
            }
        }
    }
}
