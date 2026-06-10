using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorldCup.Application.Predictions.Commands.CreatePrediction;
using WorldCup.Application.Predictions.Commands.UpdatePrediction;
using WorldCup.Application.Predictions.Queries.GetUserPredictions;

namespace WorldCup.API.Controllers;

[ApiController]
[Route("api/predictions")]
[Authorize]
public class PredictionsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMyPredictions([FromQuery] Guid groupId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetUserPredictionsQuery(groupId), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePredictionCommand command, CancellationToken ct)
    {
        var id = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetMyPredictions), new { groupId = command.GroupId }, new { id });
    }

    [HttpPut("{predictionId:guid}")]
    public async Task<IActionResult> Update(Guid predictionId, [FromBody] UpdatePredictionRequest request, CancellationToken ct)
    {
        await mediator.Send(new UpdatePredictionCommand(predictionId, request.HomeGoals, request.AwayGoals, request.Qualifier), ct);
        return NoContent();
    }
}

public record UpdatePredictionRequest(int HomeGoals, int AwayGoals, string? Qualifier = null);
