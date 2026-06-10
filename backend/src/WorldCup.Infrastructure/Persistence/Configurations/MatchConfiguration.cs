using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WorldCup.Domain.Aggregates.Match;

namespace WorldCup.Infrastructure.Persistence.Configurations;

public class MatchConfiguration : IEntityTypeConfiguration<Match>
{
    public void Configure(EntityTypeBuilder<Match> builder)
    {
        builder.HasKey(m => m.Id);
        builder.Property(m => m.HomeTeam).IsRequired().HasMaxLength(100);
        builder.Property(m => m.AwayTeam).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Stage).IsRequired().HasMaxLength(50);
        builder.Property(m => m.GroupName).HasMaxLength(10);
        builder.Property(m => m.HomeFlagUrl).HasMaxLength(500);
        builder.Property(m => m.AwayFlagUrl).HasMaxLength(500);
        builder.Property(m => m.Status).HasConversion<string>();
        builder.Property(m => m.QualifierTeam).HasMaxLength(10);

        builder.Property(m => m.HomePenalties);
        builder.Property(m => m.AwayPenalties);

        builder.OwnsOne(m => m.Score, score =>
        {
            score.Property(s => s.HomeGoals).HasColumnName("HomeGoals").HasDefaultValue(0);
            score.Property(s => s.AwayGoals).HasColumnName("AwayGoals").HasDefaultValue(0);
        });

        builder.HasIndex(m => m.ExternalId).IsUnique().HasFilter("\"ExternalId\" IS NOT NULL");
        builder.HasIndex(m => m.KickoffUtc);
        builder.HasIndex(m => m.Status);

        builder.Ignore(m => m.DomainEvents);
    }
}
