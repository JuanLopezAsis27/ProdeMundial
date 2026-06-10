using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorldCup.Domain.Aggregates.Prediction;

namespace WorldCup.Infrastructure.Persistence.Configurations;

public class PredictionConfiguration : IEntityTypeConfiguration<Prediction>
{
    public void Configure(EntityTypeBuilder<Prediction> builder)
    {
        builder.HasKey(p => p.Id);
        builder.HasIndex(p => new { p.UserId, p.MatchId, p.GroupId }).IsUnique();
        builder.HasIndex(p => p.MatchId);
        builder.HasIndex(p => new { p.UserId, p.GroupId });
        builder.Property(p => p.PredictedQualifier).HasMaxLength(10);
        builder.Ignore(p => p.DomainEvents);
    }
}
