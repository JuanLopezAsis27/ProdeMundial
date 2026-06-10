using MediatR;
using WorldCup.Application.Predictions.Queries.GetUserPredictions;

namespace WorldCup.Application.Groups.Queries.GetMemberPredictions;

public record GetMemberPredictionsQuery(Guid GroupId, Guid UserId) : IRequest<IEnumerable<PredictionDto>>;
