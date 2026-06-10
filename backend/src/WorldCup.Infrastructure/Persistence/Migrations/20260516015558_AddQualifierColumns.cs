using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorldCup.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQualifierColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PredictedQualifier",
                table: "Predictions",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QualifierTeam",
                table: "Matches",
                type: "character varying(10)",
                maxLength: 10,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PredictedQualifier",
                table: "Predictions");

            migrationBuilder.DropColumn(
                name: "QualifierTeam",
                table: "Matches");
        }
    }
}
