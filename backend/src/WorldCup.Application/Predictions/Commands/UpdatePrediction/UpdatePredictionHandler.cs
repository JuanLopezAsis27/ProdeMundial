using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Predictions.Commands.UpdatePrediction;

public class UpdatePredictionHandler(
    IPredictionRepository predictionRepository,
    IMatchRepository matchRepository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdatePredictionCommand>
{
    public async Task Handle(UpdatePredictionCommand command, CancellationToken ct)
    {
        var prediction = await predictionRepository.GetByIdAsync(command.PredictionId, ct)
            ?? throw new NotFoundException("Predicción no encontrada.");

        if (prediction.UserId != currentUser.UserId)
            throw new ForbiddenException("No puedes modificar la predicción de otro usuario.");

        var match = await matchRepository.GetByIdAsync(prediction.MatchId, ct)
            ?? throw new NotFoundException("Partido no encontrado.");

        prediction.Update(command.HomeGoals, command.AwayGoals, match.KickoffUtc, command.Qualifier);
        predictionRepository.Update(prediction);
        await unitOfWork.SaveChangesAsync(ct);
    }
}
