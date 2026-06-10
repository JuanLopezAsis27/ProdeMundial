using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup.Application.Groups.Commands.CreateGroup;
using WorldCup.Application.Groups.Commands.JoinGroup;
using WorldCup.Application.Groups.Queries.GetGroupLeaderboard;
using WorldCup.Application.Groups.Queries.GetGroupStats;
using WorldCup.Application.Groups.Queries.GetMemberPredictions;
using WorldCup.Application.Groups.Queries.GetMyGroups;

namespace WorldCup.API.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize]
public class GroupsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyGroups(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyGroupsQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateGroupCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinGroupRequest request, CancellationToken ct)
    {
        var groupId = await mediator.Send(new JoinGroupCommand(request.Code), ct);
        return Ok(new { groupId });
    }

    [HttpGet("{groupId:guid}/leaderboard")]
    public async Task<IActionResult> GetLeaderboard(Guid groupId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetGroupLeaderboardQuery(groupId), ct);
        return Ok(result);
    }

    [HttpGet("{groupId:guid}/stats")]
    public async Task<IActionResult> GetStats(Guid groupId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetGroupStatsQuery(groupId), ct);
        return Ok(result);
    }

    [HttpGet("{groupId:guid}/members/{userId:guid}/predictions")]
    public async Task<IActionResult> GetMemberPredictions(Guid groupId, Guid userId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetMemberPredictionsQuery(groupId, userId), ct);
        return Ok(result);
    }
}

public record JoinGroupRequest(string Code);
