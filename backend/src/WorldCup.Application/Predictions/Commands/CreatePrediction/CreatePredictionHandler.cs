using MediatR;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Aggregates.Prediction;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Predictions.Commands.CreatePrediction;

public class CreatePredictionHandler(
    IPredictionRepository predictionRepository,
    IMatchRepository matchRepository,
    IGroupRepository groupRepository,
    ICurrentUserService currentUser,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreatePredictionCommand, Guid>
{
    public async Task<Guid> Handle(CreatePredictionCommand command, CancellationToken ct)
    {
        var match = await matchRepository.GetByIdAsync(command.MatchId, ct)
            ?? throw new NotFoundException("Partido no encontrado.");

        var group = await groupRepository.GetByIdAsync(command.GroupId, ct)
            ?? throw new NotFoundException("Grupo no encontrado.");

        if (!group.IsMember(currentUser.UserId))
            throw new ForbiddenException("No eres miembro de este grupo.");

        var existing = await predictionRepository.GetByUserMatchGroupAsync(
            currentUser.UserId, command.MatchId, command.GroupId, ct);

        if (existing is not null)
            throw new ConflictException("Ya existe una predicción para este partido en este grupo.");

        var prediction = Prediction.Create(
            currentUser.UserId,
            command.MatchId,
            command.GroupId,
            command.HomeGoals,
            command.AwayGoals,
            match.KickoffUtc,
            command.Qualifier);

        await predictionRepository.AddAsync(prediction, ct);
        await unitOfWork.SaveChangesAsync(ct);

        return prediction.Id;
    }
}
