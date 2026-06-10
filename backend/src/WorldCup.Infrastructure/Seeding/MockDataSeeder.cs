using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WorldCup.Application.Common.Interfaces;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Aggregates.User;
using WorldCup.Infrastructure.Persistence;

namespace WorldCup.Infrastructure.Seeding;

public class MockDataSeeder(
    AppDbContext db,
    IPasswordHasher passwordHasher,
    ILogger<MockDataSeeder> logger)
{
    private const string AdminEmail = "admin@mundial2026.com";
    private const string AdminPassword = "Admin2026!";
    private const string FlagBase = "https://flagcdn.com/w80";
    private static string Flag(string code) => $"{FlagBase}/{code}.png";

    private record Team(string Name, string FlagCode);

    // Real FIFA 2026 groups (48 teams, 12 groups of 4)
    private static readonly (string Group, Team[] Teams)[] Groups =
    [
        ("A", [new("México",               "mx"), new("Sudáfrica",           "za"), new("Corea del Sur",        "kr"), new("Chequia",              "cz")]),
        ("B", [new("Canadá",               "ca"), new("Bosnia y Herzegovina","ba"), new("Qatar",                "qa"), new("Suiza",                "ch")]),
        ("C", [new("Brasil",               "br"), new("Marruecos",           "ma"), new("Haití",               "ht"), new("Escocia",              "gb-sct")]),
        ("D", [new("Estados Unidos",       "us"), new("Paraguay",            "py"), new("Australia",            "au"), new("Turquía",              "tr")]),
        ("E", [new("Alemania",             "de"), new("Curazao",             "cw"), new("Costa de Marfil",      "ci"), new("Ecuador",              "ec")]),
        ("F", [new("Países Bajos",         "nl"), new("Japón",              "jp"), new("Suecia",               "se"), new("Túnez",               "tn")]),
        ("G", [new("Bélgica",             "be"), new("Egipto",              "eg"), new("Irán",                "ir"), new("Nueva Zelanda",        "nz")]),
        ("H", [new("España",              "es"), new("Cabo Verde",          "cv"), new("Arabia Saudita",       "sa"), new("Uruguay",              "uy")]),
        ("I", [new("Francia",             "fr"), new("Senegal",             "sn"), new("Irak",                "iq"), new("Noruega",              "no")]),
        ("J", [new("Argentina",           "ar"), new("Argelia",             "dz"), new("Austria",              "at"), new("Jordania",             "jo")]),
        ("K", [new("Portugal",            "pt"), new("R.D. del Congo",      "cd"), new("Uzbekistán",          "uz"), new("Colombia",             "co")]),
        ("L", [new("Inglaterra",          "gb-eng"), new("Croacia",         "hr"), new("Ghana",               "gh"), new("Panamá",              "pa")]),
    ];

    // All 72 group stage matches — real FIFA 2026 schedule, kickoff times in UTC (CDMX UTC-6, +6h)
    // Format: (group, home index, away index, UTC kickoff)
    private static readonly (string G, int H, int A, DateTime Kickoff)[] GroupMatches =
    [
        // June 11 — P1, P2
        ("A", 0, 1, Utc(2026,6,11, 0,0)),  // México vs Sudáfrica  18:00 CDMX
        ("B", 0, 1, Utc(2026,6,11, 3,0)),  // Canadá vs Bosnia     21:00 CDMX

        // June 12 — P3, P4, P5
        ("C", 0, 1, Utc(2026,6,12, 0,0)),  // Brasil vs Marruecos
        ("D", 0, 1, Utc(2026,6,12, 3,0)),  // EEUU vs Paraguay
        ("E", 0, 1, Utc(2026,6,13, 0,0)),  // Alemania vs Curazao

        // June 13 — P6, P7
        ("F", 0, 1, Utc(2026,6,13, 3,0)),  // Países Bajos vs Japón
        ("G", 0, 1, Utc(2026,6,14, 0,0)),  // Bélgica vs Egipto

        // June 14 — P8, P9
        ("H", 0, 1, Utc(2026,6,14, 3,0)),  // España vs Cabo Verde
        ("I", 0, 1, Utc(2026,6,15, 0,0)),  // Francia vs Senegal

        // June 15 — P10, P11, P12
        ("J", 0, 1, Utc(2026,6,15, 3,0)),  // Argentina vs Argelia
        ("K", 0, 1, Utc(2026,6,16, 0,0)),  // Portugal vs R.D. del Congo
        ("L", 0, 1, Utc(2026,6,16, 3,0)),  // Inglaterra vs Croacia

        // June 16-17 — MD1 second matches
        ("A", 2, 3, Utc(2026,6,17, 0,0)),  // Corea del Sur vs Chequia
        ("B", 2, 3, Utc(2026,6,17, 3,0)),  // Qatar vs Suiza
        ("C", 2, 3, Utc(2026,6,18, 0,0)),  // Haití vs Escocia
        ("D", 2, 3, Utc(2026,6,18, 3,0)),  // Australia vs Turquía
        ("E", 2, 3, Utc(2026,6,19, 0,0)),  // Costa de Marfil vs Ecuador
        ("F", 2, 3, Utc(2026,6,19, 3,0)),  // Suecia vs Túnez
        ("G", 2, 3, Utc(2026,6,20, 0,0)),  // Irán vs Nueva Zelanda
        ("H", 2, 3, Utc(2026,6,20, 3,0)),  // Arabia Saudita vs Uruguay
        ("I", 2, 3, Utc(2026,6,21, 0,0)),  // Irak vs Noruega
        ("J", 2, 3, Utc(2026,6,21, 3,0)),  // Austria vs Jordania
        ("K", 2, 3, Utc(2026,6,22, 0,0)),  // Uzbekistán vs Colombia
        ("L", 2, 3, Utc(2026,6,22, 3,0)),  // Ghana vs Panamá

        // --- Matchday 2 ---
        // June 23-24
        ("A", 0, 2, Utc(2026,6,23, 0,0)),  // México vs Corea del Sur
        ("A", 1, 3, Utc(2026,6,23, 3,0)),  // Sudáfrica vs Chequia
        ("B", 0, 2, Utc(2026,6,24, 0,0)),  // Canadá vs Qatar
        ("B", 1, 3, Utc(2026,6,24, 3,0)),  // Bosnia vs Suiza
        ("C", 0, 2, Utc(2026,6,25, 0,0)),  // Brasil vs Haití
        ("C", 1, 3, Utc(2026,6,25, 3,0)),  // Marruecos vs Escocia
        ("D", 0, 2, Utc(2026,6,26, 0,0)),  // EEUU vs Australia
        ("D", 1, 3, Utc(2026,6,26, 3,0)),  // Paraguay vs Turquía
        ("E", 0, 2, Utc(2026,6,27, 0,0)),  // Alemania vs Costa de Marfil
        ("E", 1, 3, Utc(2026,6,27, 3,0)),  // Curazao vs Ecuador
        ("F", 0, 2, Utc(2026,6,28, 0,0)),  // Países Bajos vs Suecia
        ("F", 1, 3, Utc(2026,6,28, 3,0)),  // Japón vs Túnez
        ("G", 0, 2, Utc(2026,6,29, 0,0)),  // Bélgica vs Irán
        ("G", 1, 3, Utc(2026,6,29, 3,0)),  // Egipto vs Nueva Zelanda
        ("H", 0, 2, Utc(2026,6,30, 0,0)),  // España vs Arabia Saudita
        ("H", 1, 3, Utc(2026,6,30, 3,0)),  // Cabo Verde vs Uruguay
        ("I", 0, 2, Utc(2026,7, 1, 0,0)),  // Francia vs Irak
        ("I", 1, 3, Utc(2026,7, 1, 3,0)),  // Senegal vs Noruega
        ("J", 0, 2, Utc(2026,7, 2, 0,0)),  // Argentina vs Austria
        ("J", 1, 3, Utc(2026,7, 2, 3,0)),  // Argelia vs Jordania
        ("K", 0, 2, Utc(2026,7, 3, 0,0)),  // Portugal vs Uzbekistán
        ("K", 1, 3, Utc(2026,7, 3, 3,0)),  // R.D. del Congo vs Colombia
        ("L", 0, 2, Utc(2026,7, 4, 0,0)),  // Inglaterra vs Ghana
        ("L", 1, 3, Utc(2026,7, 4, 3,0)),  // Croacia vs Panamá

        // --- Matchday 3 (simultaneous within group) ---
        ("A", 0, 3, Utc(2026,7, 6, 0,0)),  // México vs Chequia
        ("A", 1, 2, Utc(2026,7, 6, 0,0)),  // Sudáfrica vs Corea del Sur
        ("B", 0, 3, Utc(2026,7, 6, 3,0)),  // Canadá vs Suiza
        ("B", 1, 2, Utc(2026,7, 6, 3,0)),  // Bosnia vs Qatar
        ("C", 0, 3, Utc(2026,7, 7, 0,0)),  // Brasil vs Escocia
        ("C", 1, 2, Utc(2026,7, 7, 0,0)),  // Marruecos vs Haití
        ("D", 0, 3, Utc(2026,7, 7, 3,0)),  // EEUU vs Turquía
        ("D", 1, 2, Utc(2026,7, 7, 3,0)),  // Paraguay vs Australia
        ("E", 0, 3, Utc(2026,7, 8, 0,0)),  // Alemania vs Ecuador
        ("E", 1, 2, Utc(2026,7, 8, 0,0)),  // Curazao vs Costa de Marfil
        ("F", 0, 3, Utc(2026,7, 8, 3,0)),  // Países Bajos vs Túnez
        ("F", 1, 2, Utc(2026,7, 8, 3,0)),  // Japón vs Suecia
        ("G", 0, 3, Utc(2026,7, 9, 0,0)),  // Bélgica vs Nueva Zelanda
        ("G", 1, 2, Utc(2026,7, 9, 0,0)),  // Egipto vs Irán
        ("H", 0, 3, Utc(2026,7, 9, 3,0)),  // España vs Uruguay
        ("H", 1, 2, Utc(2026,7, 9, 3,0)),  // Cabo Verde vs Arabia Saudita
        ("I", 0, 3, Utc(2026,7,10, 0,0)),  // Francia vs Noruega
        ("I", 1, 2, Utc(2026,7,10, 0,0)),  // Senegal vs Irak
        ("J", 0, 3, Utc(2026,7,10, 3,0)),  // Argentina vs Jordania
        ("J", 1, 2, Utc(2026,7,10, 3,0)),  // Argelia vs Austria
        ("K", 0, 3, Utc(2026,7,11, 0,0)),  // Portugal vs Colombia
        ("K", 1, 2, Utc(2026,7,11, 0,0)),  // R.D. del Congo vs Uzbekistán
        ("L", 0, 3, Utc(2026,7,11, 3,0)),  // Inglaterra vs Panamá
        ("L", 1, 2, Utc(2026,7,11, 3,0)),  // Croacia vs Ghana
    ];

    // Knockout slots — keyed P73..P104 to allow bracket generation to update them
    // R32: P73-P88, R16: P89-P96, QF: P97-P100, SF: P101-P102, 3rd: P103, Final: P104
    // R32 matchup source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
    private static readonly (string Label, string Stage, DateTime Kickoff)[] KnockoutSlots =
    [
        // Round of 32 — 16 matches (P73–P88)
        ("P73 2A vs 2B",  "Round of 32", Utc(2026,7,14, 0,0)),
        ("P74 1E vs 3rd", "Round of 32", Utc(2026,7,14, 3,0)),
        ("P75 1F vs 2C",  "Round of 32", Utc(2026,7,15, 0,0)),
        ("P76 1C vs 2F",  "Round of 32", Utc(2026,7,15, 3,0)),
        ("P77 1I vs 3rd", "Round of 32", Utc(2026,7,16, 0,0)),
        ("P78 2E vs 2I",  "Round of 32", Utc(2026,7,16, 3,0)),
        ("P79 1A vs 3rd", "Round of 32", Utc(2026,7,17, 0,0)),
        ("P80 1L vs 3rd", "Round of 32", Utc(2026,7,17, 3,0)),
        ("P81 1D vs 3rd", "Round of 32", Utc(2026,7,18, 0,0)),
        ("P82 1G vs 3rd", "Round of 32", Utc(2026,7,18, 3,0)),
        ("P83 2K vs 2L",  "Round of 32", Utc(2026,7,19, 0,0)),
        ("P84 1H vs 2J",  "Round of 32", Utc(2026,7,19, 3,0)),
        ("P85 1B vs 3rd", "Round of 32", Utc(2026,7,20, 0,0)),
        ("P86 1J vs 2H",  "Round of 32", Utc(2026,7,20, 3,0)),
        ("P87 1K vs 3rd", "Round of 32", Utc(2026,7,21, 0,0)),
        ("P88 2D vs 2G",  "Round of 32", Utc(2026,7,21, 3,0)),

        // Round of 16 — 8 matches (P89–P96)
        ("P89 W73 vs W74","Round of 16", Utc(2026,7,25, 0,0)),
        ("P90 W75 vs W76","Round of 16", Utc(2026,7,25, 3,0)),
        ("P91 W77 vs W78","Round of 16", Utc(2026,7,26, 0,0)),
        ("P92 W79 vs W80","Round of 16", Utc(2026,7,26, 3,0)),
        ("P93 W81 vs W82","Round of 16", Utc(2026,7,27, 0,0)),
        ("P94 W83 vs W84","Round of 16", Utc(2026,7,27, 3,0)),
        ("P95 W85 vs W86","Round of 16", Utc(2026,7,28, 0,0)),
        ("P96 W87 vs W88","Round of 16", Utc(2026,7,28, 3,0)),

        // Quarter-finals — 4 matches (P97–P100)
        ("P97 W89 vs W90","Quarter-finals", Utc(2026,8, 1, 0,0)),
        ("P98 W91 vs W92","Quarter-finals", Utc(2026,8, 1, 3,0)),
        ("P99 W93 vs W94","Quarter-finals", Utc(2026,8, 2, 0,0)),
        ("P100 W95 vs W96","Quarter-finals",Utc(2026,8, 2, 3,0)),

        // Semi-finals — 2 matches (P101–P102)
        ("P101 W97 vs W98", "Semi-finals",  Utc(2026,8, 5, 0,0)),
        ("P102 W99 vs W100","Semi-finals",  Utc(2026,8, 5, 3,0)),

        // Third Place — P103
        ("P103 Tercer lugar","Third Place", Utc(2026,8, 8,23,0)),

        // Final — P104
        ("P104 Final",       "Final",       Utc(2026,8,10, 0,0)),
    ];

    public async Task SeedAsync()
    {
        await SeedAdminAsync();
        await SeedMatchesAsync();
        await SeedTodayTestMatchesAsync();
    }

    private async Task SeedAdminAsync()
    {
        var exists = await db.Users.AnyAsync(u => u.Email.Value == AdminEmail.ToLowerInvariant());
        if (exists) return;

        var hash = passwordHasher.Hash(AdminPassword);
        var admin = User.Create(AdminEmail, "Admin", hash);
        await db.Users.AddAsync(admin);
        await db.SaveChangesAsync();
        logger.LogInformation("Admin creado → Email: {Email}  Password: {Password}", AdminEmail, AdminPassword);
    }

    private async Task SeedMatchesAsync()
    {
        if (await db.Matches.AnyAsync()) return;

        var teamMap = Groups.ToDictionary(g => g.Group, g => g.Teams);
        var matches = new List<Match>();

        foreach (var (g, hi, ai, kickoff) in GroupMatches)
        {
            var teams = teamMap[g];
            matches.Add(Match.Create(
                teams[hi].Name, teams[ai].Name,
                kickoff, "Group Stage", g, null,
                Flag(teams[hi].FlagCode), Flag(teams[ai].FlagCode)));
        }

        // Knockout placeholder matches
        foreach (var (label, stage, kickoff) in KnockoutSlots)
        {
            matches.Add(Match.Create(label.Split(' ')[0], "TBD", kickoff, stage));
        }

        await db.Matches.AddRangeAsync(matches);
        await db.SaveChangesAsync();
        logger.LogInformation("Sembrados {Count} partidos del Mundial 2026 (72 grupos + {K} eliminatorias)",
            matches.Count, KnockoutSlots.Length);
    }

    private async Task SeedTodayTestMatchesAsync()
    {
        var today = DateTime.UtcNow.Date;
        var alreadyHasToday = await db.Matches
            .AnyAsync(m => m.KickoffUtc >= today && m.KickoffUtc < today.AddDays(1) && m.Stage == "Friendly");
        if (alreadyHasToday) return;

        var testSlots = new (string Home, string HomeCode, string Away, string AwayCode, int Hour)[]
        {
            ("Francia",      "fr",    "Inglaterra",   "gb-eng", 18),
            ("Brasil",       "br",    "Argentina",    "ar",     20),
            ("Alemania",     "de",    "España",       "es",     21),
            ("Italia",       "it",    "Portugal",     "pt",     22),
            ("Países Bajos", "nl",    "Bélgica",      "be",     23),
        };

        var now = DateTime.UtcNow;
        var added = 0;
        foreach (var (home, homeCode, away, awayCode, hour) in testSlots)
        {
            var kickoff = today.AddHours(hour);
            if (kickoff <= now) continue;

            var match = Match.Create(home, away, kickoff, "Friendly", null, null,
                Flag(homeCode), Flag(awayCode));
            await db.Matches.AddAsync(match);
            added++;
        }

        if (added > 0)
        {
            await db.SaveChangesAsync();
            logger.LogInformation("Sembrados {Count} partidos de prueba para hoy ({Date})", added, today.ToString("yyyy-MM-dd"));
        }
    }

    private static DateTime Utc(int y, int mo, int d, int h, int mi) =>
        new(y, mo, d, h, mi, 0, DateTimeKind.Utc);
}
