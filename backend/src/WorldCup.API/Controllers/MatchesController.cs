using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup.Application.Matches.Commands.SeedFixture;
using WorldCup.Application.Matches.Commands.SyncMatchResults;
using WorldCup.Application.Matches.Queries.GetExternalLiveMatches;
using WorldCup.Application.Matches.Queries.GetTodayMatches;
using WorldCup.Application.Matches.Queries.GetWorldCupFixture;

namespace WorldCup.API.Controllers;

[ApiController]
[Route("api/matches")]
[Authorize]
public class MatchesController(IMediator mediator) : ControllerBase
{
    [HttpGet("today")]
    public async Task<IActionResult> GetTodayMatches(CancellationToken ct)
    {
        var result = await mediator.Send(new GetTodayMatchesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("live")]
    public async Task<IActionResult> GetLiveMatches(CancellationToken ct)
    {
        var result = await mediator.Send(new GetExternalLiveMatchesQuery(), ct);
        return Ok(result);
    }

    [HttpGet("fixture")]
    public async Task<IActionResult> GetFixture(CancellationToken ct)
    {
        var result = await mediator.Send(new GetWorldCupFixtureQuery(), ct);
        return Ok(result);
    }

    [HttpPost("sync")]
    [AllowAnonymous]
    public async Task<IActionResult> Sync(CancellationToken ct)
    {
        await mediator.Send(new SyncMatchResultsCommand(), ct);
        return Ok(new { message = "Sincronización completada" });
    }

    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> Seed(CancellationToken ct)
    {
        var added = await mediator.Send(new SeedFixtureCommand(), ct);
        return Ok(new { message = $"Seed completado: {added} partidos nuevos" });
    }
}
