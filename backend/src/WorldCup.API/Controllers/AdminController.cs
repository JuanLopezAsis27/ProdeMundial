using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup.Application.Admin.Commands.CreateMatch;
using WorldCup.Application.Admin.Commands.DeleteGroup;
using WorldCup.Application.Admin.Commands.DeleteUser;
using WorldCup.Application.Admin.Commands.GenerateKnockoutBracket;
using WorldCup.Application.Admin.Commands.ImportToday;
using WorldCup.Application.Admin.Commands.SetPenalties;
using WorldCup.Application.Admin.Commands.SimulateMatch;
using WorldCup.Application.Admin.Commands.UpdateMatch;
using WorldCup.Application.Admin.Queries;
using WorldCup.Application.Matches.Commands.SeedFixture;
using WorldCup.Application.Matches.Queries.GetWorldCupFixture;

namespace WorldCup.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController(IMediator mediator) : ControllerBase
{
    // --- Matches ---

    [HttpGet("matches")]
    public async Task<IActionResult> GetMatches(CancellationToken ct)
    {
        var result = await mediator.Send(new GetWorldCupFixtureQuery(), ct);
        return Ok(result);
    }

    [HttpPost("matches")]
    public async Task<IActionResult> CreateMatch([FromBody] CreateMatchRequest body, CancellationToken ct)
    {
        var id = await mediator.Send(new CreateMatchCommand(
            body.HomeTeam, body.AwayTeam, body.KickoffUtc, body.Stage,
            body.GroupName, body.HomeFlagUrl, body.AwayFlagUrl), ct);
        return Ok(new { id, message = "Partido creado" });
    }

    [HttpPut("matches/{id:guid}")]
    public async Task<IActionResult> UpdateMatch(Guid id, [FromBody] UpdateMatchRequest body, CancellationToken ct)
    {
        await mediator.Send(new UpdateMatchCommand(
            id, body.HomeTeam, body.AwayTeam, body.KickoffUtc, body.Stage,
            body.GroupName, body.HomeFlagUrl, body.AwayFlagUrl), ct);
        return Ok(new { message = "Partido actualizado" });
    }

    [HttpPost("matches/{id:guid}/simulate")]
    public async Task<IActionResult> Simulate(Guid id, [FromBody] SimulateRequest body, CancellationToken ct)
    {
        await mediator.Send(new SimulateMatchCommand(
            id, body.HomeGoals, body.AwayGoals, body.Finish, body.Qualifier,
            body.HomePenalties, body.AwayPenalties), ct);
        return Ok(new { message = "Simulación aplicada" });
    }

    [HttpPut("matches/{id:guid}/penalties")]
    public async Task<IActionResult> SetPenalties(Guid id, [FromBody] PenaltiesRequest body, CancellationToken ct)
    {
        await mediator.Send(new SetPenaltiesCommand(id, body.HomePenalties, body.AwayPenalties), ct);
        return Ok(new { message = "Penales actualizados" });
    }

    [HttpPut("matches/{id:guid}/qualifier")]
    public async Task<IActionResult> SetQualifier(Guid id, [FromBody] QualifierRequest body, CancellationToken ct)
    {
        // Use simulate with same score to just set qualifier
        await mediator.Send(new SimulateMatchCommand(id, body.HomeGoals, body.AwayGoals, true, body.Qualifier, body.HomePenalties, body.AwayPenalties), ct);
        return Ok(new { message = "Clasificado actualizado" });
    }

    [HttpPost("import-fixture")]
    public async Task<IActionResult> ImportFixture(CancellationToken ct)
    {
        var count = await mediator.Send(new SeedFixtureCommand(), ct);
        return Ok(new { count, message = $"{count} partidos del Mundial 2026 importados desde la API" });
    }

    [HttpPost("import-today")]
    public async Task<IActionResult> ImportToday(CancellationToken ct)
    {
        var count = await mediator.Send(new ImportTodayMatchesCommand(), ct);
        return Ok(new { count, message = $"{count} partidos de hoy importados" });
    }

    [HttpPost("generate-bracket")]
    public async Task<IActionResult> GenerateBracket(CancellationToken ct)
    {
        var count = await mediator.Send(new GenerateKnockoutBracketCommand(), ct);
        return Ok(new { count, message = $"{count} partidos de eliminatorias actualizados" });
    }

    // --- Users ---

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAllUsersQuery(), ct);
        return Ok(result);
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteUserCommand(id), ct);
        return Ok(new { message = "Usuario eliminado" });
    }

    // --- Groups ---

    [HttpGet("groups")]
    public async Task<IActionResult> GetGroups(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAllGroupsQuery(), ct);
        return Ok(result);
    }

    [HttpDelete("groups/{id:guid}")]
    public async Task<IActionResult> DeleteGroup(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteGroupCommand(id), ct);
        return Ok(new { message = "Grupo eliminado" });
    }
}

public record SimulateRequest(int HomeGoals, int AwayGoals, bool Finish = true, string? Qualifier = null, int? HomePenalties = null, int? AwayPenalties = null);
public record CreateMatchRequest(string HomeTeam, string AwayTeam, DateTime KickoffUtc, string Stage, string? GroupName = null, string? HomeFlagUrl = null, string? AwayFlagUrl = null);
public record UpdateMatchRequest(string HomeTeam, string AwayTeam, DateTime KickoffUtc, string Stage, string? GroupName = null, string? HomeFlagUrl = null, string? AwayFlagUrl = null);
public record PenaltiesRequest(int HomePenalties, int AwayPenalties);
public record QualifierRequest(string Qualifier, int HomeGoals, int AwayGoals, int? HomePenalties = null, int? AwayPenalties = null);
