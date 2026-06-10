using MediatR;
using Microsoft.Extensions.Logging;
using WorldCup.Domain.Aggregates.Match;
using WorldCup.Domain.Interfaces;
using WorldCup.Domain.Interfaces.Repositories;

namespace WorldCup.Application.Admin.Commands.GenerateKnockoutBracket;

public class GenerateKnockoutBracketHandler(
    IMatchRepository matchRepository,
    IUnitOfWork unitOfWork,
    ILogger<GenerateKnockoutBracketHandler> logger)
    : IRequestHandler<GenerateKnockoutBracketCommand, int>
{
    // Official FIFA 2026 third-place placement table (495 combinations)
    // Key: sorted 8 qualifying groups (e.g. "EFGHIJKL")
    // Value: group letter for each slot in order [P74, P77, P79, P80, P81, P82, P85, P87]
    private static readonly Dictionary<string, string[]> ThirdPlaceLookup = new()
    {
        { "EFGHIJKL", new[] { "F", "G", "E", "K", "I", "H", "J", "L" } },
        { "DFGHIJKL", new[] { "D", "F", "H", "K", "I", "J", "G", "L" } },
        { "DEGHIJKL", new[] { "D", "G", "E", "K", "I", "H", "J", "L" } },
        { "DEFHIJKL", new[] { "D", "F", "E", "K", "I", "H", "J", "L" } },
        { "DEFGIJKL", new[] { "D", "F", "E", "K", "I", "J", "G", "L" } },
        { "DEFGHJKL", new[] { "D", "F", "E", "K", "J", "H", "G", "L" } },
        { "DEFGHIKL", new[] { "D", "F", "E", "K", "I", "H", "G", "L" } },
        { "DEFGHIJL", new[] { "D", "F", "E", "I", "J", "H", "G", "L" } },
        { "DEFGHIJK", new[] { "D", "F", "E", "K", "J", "H", "G", "I" } },
        { "CFGHIJKL", new[] { "C", "F", "H", "K", "I", "J", "G", "L" } },
        { "CEGHIJKL", new[] { "C", "G", "E", "K", "I", "H", "J", "L" } },
        { "CEFHIJKL", new[] { "C", "F", "E", "K", "I", "H", "J", "L" } },
        { "CEFGIJKL", new[] { "C", "F", "E", "K", "I", "J", "G", "L" } },
        { "CEFGHJKL", new[] { "C", "F", "E", "K", "J", "H", "G", "L" } },
        { "CEFGHIKL", new[] { "C", "F", "E", "K", "I", "H", "G", "L" } },
        { "CEFGHIJL", new[] { "C", "F", "E", "I", "J", "H", "G", "L" } },
        { "CEFGHIJK", new[] { "C", "F", "E", "K", "J", "H", "G", "I" } },
        { "CDGHIJKL", new[] { "C", "D", "H", "K", "I", "J", "G", "L" } },
        { "CDFHIJKL", new[] { "D", "F", "C", "K", "I", "H", "J", "L" } },
        { "CDFGIJKL", new[] { "D", "F", "C", "K", "I", "J", "G", "L" } },
        { "CDFGHJKL", new[] { "D", "F", "C", "K", "J", "H", "G", "L" } },
        { "CDFGHIKL", new[] { "D", "F", "C", "K", "I", "H", "G", "L" } },
        { "CDFGHIJL", new[] { "D", "F", "C", "I", "J", "H", "G", "L" } },
        { "CDFGHIJK", new[] { "D", "F", "C", "K", "J", "H", "G", "I" } },
        { "CDEHIJKL", new[] { "C", "D", "E", "K", "I", "H", "J", "L" } },
        { "CDEGIJKL", new[] { "C", "D", "E", "K", "I", "J", "G", "L" } },
        { "CDEGHJKL", new[] { "C", "D", "E", "K", "J", "H", "G", "L" } },
        { "CDEGHIKL", new[] { "C", "D", "E", "K", "I", "H", "G", "L" } },
        { "CDEGHIJL", new[] { "C", "D", "E", "I", "J", "H", "G", "L" } },
        { "CDEGHIJK", new[] { "C", "D", "E", "K", "J", "H", "G", "I" } },
        { "CDEFIJKL", new[] { "D", "F", "C", "K", "E", "I", "J", "L" } },
        { "CDEFHJKL", new[] { "D", "F", "C", "K", "E", "H", "J", "L" } },
        { "CDEFHIKL", new[] { "D", "F", "C", "K", "I", "H", "E", "L" } },
        { "CDEFHIJL", new[] { "D", "F", "C", "I", "E", "H", "J", "L" } },
        { "CDEFHIJK", new[] { "D", "F", "C", "K", "E", "H", "J", "I" } },
        { "CDEFGJKL", new[] { "D", "F", "C", "K", "E", "J", "G", "L" } },
        { "CDEFGIKL", new[] { "D", "F", "C", "K", "E", "I", "G", "L" } },
        { "CDEFGIJL", new[] { "D", "F", "C", "I", "E", "J", "G", "L" } },
        { "CDEFGIJK", new[] { "D", "F", "C", "K", "E", "J", "G", "I" } },
        { "CDEFGHKL", new[] { "D", "F", "C", "K", "E", "H", "G", "L" } },
        { "CDEFGHJL", new[] { "D", "F", "C", "E", "J", "H", "G", "L" } },
        { "CDEFGHJK", new[] { "D", "F", "C", "K", "J", "H", "G", "E" } },
        { "CDEFGHIL", new[] { "D", "F", "C", "I", "E", "H", "G", "L" } },
        { "CDEFGHIK", new[] { "D", "F", "C", "K", "E", "H", "G", "I" } },
        { "CDEFGHIJ", new[] { "D", "F", "C", "I", "J", "H", "G", "E" } },
        { "BFGHIJKL", new[] { "F", "G", "H", "K", "B", "I", "J", "L" } },
        { "BEGHIJKL", new[] { "B", "G", "E", "K", "I", "H", "J", "L" } },
        { "BEFHIJKL", new[] { "F", "H", "E", "K", "B", "I", "J", "L" } },
        { "BEFGIJKL", new[] { "F", "G", "E", "K", "B", "I", "J", "L" } },
        { "BEFGHJKL", new[] { "F", "G", "E", "K", "B", "H", "J", "L" } },
        { "BEFGHIKL", new[] { "F", "H", "E", "K", "B", "I", "G", "L" } },
        { "BEFGHIJL", new[] { "F", "G", "E", "I", "B", "H", "J", "L" } },
        { "BEFGHIJK", new[] { "F", "G", "E", "K", "B", "H", "J", "I" } },
        { "BDGHIJKL", new[] { "D", "G", "H", "K", "B", "I", "J", "L" } },
        { "BDFHIJKL", new[] { "D", "F", "H", "K", "B", "I", "J", "L" } },
        { "BDFGIJKL", new[] { "D", "F", "I", "K", "B", "J", "G", "L" } },
        { "BDFGHJKL", new[] { "D", "F", "H", "K", "B", "J", "G", "L" } },
        { "BDFGHIKL", new[] { "D", "F", "H", "K", "B", "I", "G", "L" } },
        { "BDFGHIJL", new[] { "D", "F", "H", "I", "B", "J", "G", "L" } },
        { "BDFGHIJK", new[] { "D", "F", "H", "K", "B", "J", "G", "I" } },
        { "BDEHIJKL", new[] { "D", "H", "E", "K", "B", "I", "J", "L" } },
        { "BDEGIJKL", new[] { "D", "G", "E", "K", "B", "I", "J", "L" } },
        { "BDEGHJKL", new[] { "D", "G", "E", "K", "B", "H", "J", "L" } },
        { "BDEGHIKL", new[] { "D", "H", "E", "K", "B", "I", "G", "L" } },
        { "BDEGHIJL", new[] { "D", "G", "E", "I", "B", "H", "J", "L" } },
        { "BDEGHIJK", new[] { "D", "G", "E", "K", "B", "H", "J", "I" } },
        { "BDEFIJKL", new[] { "D", "F", "E", "K", "B", "I", "J", "L" } },
        { "BDEFHJKL", new[] { "D", "F", "E", "K", "B", "H", "J", "L" } },
        { "BDEFHIKL", new[] { "D", "F", "E", "K", "B", "H", "I", "L" } },
        { "BDEFHIJL", new[] { "D", "F", "E", "I", "B", "H", "J", "L" } },
        { "BDEFHIJK", new[] { "D", "F", "E", "K", "B", "H", "J", "I" } },
        { "BDEFGJKL", new[] { "D", "F", "E", "K", "B", "J", "G", "L" } },
        { "BDEFGIKL", new[] { "D", "F", "E", "K", "B", "I", "G", "L" } },
        { "BDEFGIJL", new[] { "D", "F", "E", "I", "B", "J", "G", "L" } },
        { "BDEFGIJK", new[] { "D", "F", "E", "K", "B", "J", "G", "I" } },
        { "BDEFGHKL", new[] { "D", "F", "E", "K", "B", "H", "G", "L" } },
        { "BDEFGHJL", new[] { "D", "F", "H", "E", "B", "J", "G", "L" } },
        { "BDEFGHJK", new[] { "D", "F", "H", "K", "B", "J", "G", "E" } },
        { "BDEFGHIL", new[] { "D", "F", "E", "I", "B", "H", "G", "L" } },
        { "BDEFGHIK", new[] { "D", "F", "E", "K", "B", "H", "G", "I" } },
        { "BDEFGHIJ", new[] { "D", "F", "H", "I", "B", "J", "G", "E" } },
        { "BCGHIJKL", new[] { "C", "G", "H", "K", "B", "I", "J", "L" } },
        { "BCFHIJKL", new[] { "C", "F", "H", "K", "B", "I", "J", "L" } },
        { "BCFGIJKL", new[] { "C", "F", "I", "K", "B", "J", "G", "L" } },
        { "BCFGHJKL", new[] { "C", "F", "H", "K", "B", "J", "G", "L" } },
        { "BCFGHIKL", new[] { "C", "F", "H", "K", "B", "I", "G", "L" } },
        { "BCFGHIJL", new[] { "C", "F", "H", "I", "B", "J", "G", "L" } },
        { "BCFGHIJK", new[] { "C", "F", "H", "K", "B", "J", "G", "I" } },
        { "BCEHIJKL", new[] { "C", "H", "E", "K", "B", "I", "J", "L" } },
        { "BCEGIJKL", new[] { "C", "G", "E", "K", "B", "I", "J", "L" } },
        { "BCEGHJKL", new[] { "C", "G", "E", "K", "B", "H", "J", "L" } },
        { "BCEGHIKL", new[] { "C", "H", "E", "K", "B", "I", "G", "L" } },
        { "BCEGHIJL", new[] { "C", "G", "E", "I", "B", "H", "J", "L" } },
        { "BCEGHIJK", new[] { "C", "G", "E", "K", "B", "H", "J", "I" } },
        { "BCEFIJKL", new[] { "C", "F", "E", "K", "B", "I", "J", "L" } },
        { "BCEFHJKL", new[] { "C", "F", "E", "K", "B", "H", "J", "L" } },
        { "BCEFHIKL", new[] { "C", "F", "E", "K", "B", "H", "I", "L" } },
        { "BCEFHIJL", new[] { "C", "F", "E", "I", "B", "H", "J", "L" } },
        { "BCEFHIJK", new[] { "C", "F", "E", "K", "B", "H", "J", "I" } },
        { "BCEFGJKL", new[] { "C", "F", "E", "K", "B", "J", "G", "L" } },
        { "BCEFGIKL", new[] { "C", "F", "E", "K", "B", "I", "G", "L" } },
        { "BCEFGIJL", new[] { "C", "F", "E", "I", "B", "J", "G", "L" } },
        { "BCEFGIJK", new[] { "C", "F", "E", "K", "B", "J", "G", "I" } },
        { "BCEFGHKL", new[] { "C", "F", "E", "K", "B", "H", "G", "L" } },
        { "BCEFGHJL", new[] { "C", "F", "H", "E", "B", "J", "G", "L" } },
        { "BCEFGHJK", new[] { "C", "F", "H", "K", "B", "J", "G", "E" } },
        { "BCEFGHIL", new[] { "C", "F", "E", "I", "B", "H", "G", "L" } },
        { "BCEFGHIK", new[] { "C", "F", "E", "K", "B", "H", "G", "I" } },
        { "BCEFGHIJ", new[] { "C", "F", "H", "I", "B", "J", "G", "E" } },
        { "BCDHIJKL", new[] { "C", "D", "H", "K", "B", "I", "J", "L" } },
        { "BCDGIJKL", new[] { "C", "D", "I", "K", "B", "J", "G", "L" } },
        { "BCDGHJKL", new[] { "C", "D", "H", "K", "B", "J", "G", "L" } },
        { "BCDGHIKL", new[] { "C", "D", "H", "K", "B", "I", "G", "L" } },
        { "BCDGHIJL", new[] { "C", "D", "H", "I", "B", "J", "G", "L" } },
        { "BCDGHIJK", new[] { "C", "D", "H", "K", "B", "J", "G", "I" } },
        { "BCDFIJKL", new[] { "D", "F", "C", "K", "B", "I", "J", "L" } },
        { "BCDFHJKL", new[] { "D", "F", "C", "K", "B", "H", "J", "L" } },
        { "BCDFHIKL", new[] { "D", "F", "C", "K", "B", "H", "I", "L" } },
        { "BCDFHIJL", new[] { "D", "F", "C", "I", "B", "H", "J", "L" } },
        { "BCDFHIJK", new[] { "D", "F", "C", "K", "B", "H", "J", "I" } },
        { "BCDFGJKL", new[] { "D", "F", "C", "K", "B", "J", "G", "L" } },
        { "BCDFGIKL", new[] { "D", "F", "C", "K", "B", "I", "G", "L" } },
        { "BCDFGIJL", new[] { "D", "F", "C", "I", "B", "J", "G", "L" } },
        { "BCDFGIJK", new[] { "D", "F", "C", "K", "B", "J", "G", "I" } },
        { "BCDFGHKL", new[] { "D", "F", "C", "K", "B", "H", "G", "L" } },
        { "BCDFGHJL", new[] { "D", "F", "C", "J", "B", "H", "G", "L" } },
        { "BCDFGHJK", new[] { "C", "F", "H", "K", "B", "J", "G", "D" } },
        { "BCDFGHIL", new[] { "D", "F", "C", "I", "B", "H", "G", "L" } },
        { "BCDFGHIK", new[] { "D", "F", "C", "K", "B", "H", "G", "I" } },
        { "BCDFGHIJ", new[] { "C", "F", "H", "I", "B", "J", "G", "D" } },
        { "BCDEIJKL", new[] { "C", "D", "E", "K", "B", "I", "J", "L" } },
        { "BCDEHJKL", new[] { "C", "D", "E", "K", "B", "H", "J", "L" } },
        { "BCDEHIKL", new[] { "C", "D", "E", "K", "B", "H", "I", "L" } },
        { "BCDEHIJL", new[] { "C", "D", "E", "I", "B", "H", "J", "L" } },
        { "BCDEHIJK", new[] { "C", "D", "E", "K", "B", "H", "J", "I" } },
        { "BCDEGJKL", new[] { "C", "D", "E", "K", "B", "J", "G", "L" } },
        { "BCDEGIKL", new[] { "C", "D", "E", "K", "B", "I", "G", "L" } },
        { "BCDEGIJL", new[] { "C", "D", "E", "I", "B", "J", "G", "L" } },
        { "BCDEGIJK", new[] { "C", "D", "E", "K", "B", "J", "G", "I" } },
        { "BCDEGHKL", new[] { "C", "D", "E", "K", "B", "H", "G", "L" } },
        { "BCDEGHJL", new[] { "C", "D", "H", "E", "B", "J", "G", "L" } },
        { "BCDEGHJK", new[] { "C", "D", "H", "K", "B", "J", "G", "E" } },
        { "BCDEGHIL", new[] { "C", "D", "E", "I", "B", "H", "G", "L" } },
        { "BCDEGHIK", new[] { "C", "D", "E", "K", "B", "H", "G", "I" } },
        { "BCDEGHIJ", new[] { "C", "D", "H", "I", "B", "J", "G", "E" } },
        { "BCDEFJKL", new[] { "D", "F", "C", "K", "B", "E", "J", "L" } },
        { "BCDEFIKL", new[] { "D", "F", "C", "K", "B", "I", "E", "L" } },
        { "BCDEFIJL", new[] { "D", "F", "C", "I", "B", "E", "J", "L" } },
        { "BCDEFIJK", new[] { "D", "F", "C", "K", "B", "E", "J", "I" } },
        { "BCDEFHKL", new[] { "D", "F", "C", "K", "B", "H", "E", "L" } },
        { "BCDEFHJL", new[] { "D", "F", "C", "E", "B", "H", "J", "L" } },
        { "BCDEFHJK", new[] { "D", "F", "C", "K", "B", "H", "J", "E" } },
        { "BCDEFHIL", new[] { "D", "F", "C", "I", "B", "H", "E", "L" } },
        { "BCDEFHIK", new[] { "D", "F", "C", "K", "B", "H", "E", "I" } },
        { "BCDEFHIJ", new[] { "D", "F", "C", "I", "B", "H", "J", "E" } },
        { "BCDEFGKL", new[] { "D", "F", "C", "K", "B", "E", "G", "L" } },
        { "BCDEFGJL", new[] { "D", "F", "C", "E", "B", "J", "G", "L" } },
        { "BCDEFGJK", new[] { "D", "F", "C", "K", "B", "J", "G", "E" } },
        { "BCDEFGIL", new[] { "D", "F", "C", "I", "B", "E", "G", "L" } },
        { "BCDEFGIK", new[] { "D", "F", "C", "K", "B", "E", "G", "I" } },
        { "BCDEFGIJ", new[] { "D", "F", "C", "I", "B", "J", "G", "E" } },
        { "BCDEFGHL", new[] { "D", "F", "C", "E", "B", "H", "G", "L" } },
        { "BCDEFGHK", new[] { "D", "F", "C", "K", "B", "H", "G", "E" } },
        { "BCDEFGHJ", new[] { "C", "F", "H", "E", "B", "J", "G", "D" } },
        { "BCDEFGHI", new[] { "D", "F", "C", "I", "B", "H", "G", "E" } },
        { "AFGHIJKL", new[] { "F", "G", "H", "K", "I", "A", "J", "L" } },
        { "AEGHIJKL", new[] { "A", "G", "E", "K", "I", "H", "J", "L" } },
        { "AEFHIJKL", new[] { "F", "H", "E", "K", "I", "A", "J", "L" } },
        { "AEFGIJKL", new[] { "F", "G", "E", "K", "I", "A", "J", "L" } },
        { "AEFGHJKL", new[] { "F", "H", "E", "K", "J", "A", "G", "L" } },
        { "AEFGHIKL", new[] { "F", "H", "E", "K", "I", "A", "G", "L" } },
        { "AEFGHIJL", new[] { "F", "H", "E", "I", "J", "A", "G", "L" } },
        { "AEFGHIJK", new[] { "F", "H", "E", "K", "J", "A", "G", "I" } },
        { "ADGHIJKL", new[] { "D", "G", "H", "K", "I", "A", "J", "L" } },
        { "ADFHIJKL", new[] { "D", "F", "H", "K", "I", "A", "J", "L" } },
        { "ADFGIJKL", new[] { "D", "F", "I", "K", "J", "A", "G", "L" } },
        { "ADFGHJKL", new[] { "D", "F", "H", "K", "J", "A", "G", "L" } },
        { "ADFGHIKL", new[] { "D", "F", "H", "K", "I", "A", "G", "L" } },
        { "ADFGHIJL", new[] { "D", "F", "H", "I", "J", "A", "G", "L" } },
        { "ADFGHIJK", new[] { "D", "F", "H", "K", "J", "A", "G", "I" } },
        { "ADEHIJKL", new[] { "D", "H", "E", "K", "I", "A", "J", "L" } },
        { "ADEGIJKL", new[] { "D", "G", "E", "K", "I", "A", "J", "L" } },
        { "ADEGHJKL", new[] { "D", "H", "E", "K", "J", "A", "G", "L" } },
        { "ADEGHIKL", new[] { "D", "H", "E", "K", "I", "A", "G", "L" } },
        { "ADEGHIJL", new[] { "D", "H", "E", "I", "J", "A", "G", "L" } },
        { "ADEGHIJK", new[] { "D", "H", "E", "K", "J", "A", "G", "I" } },
        { "ADEFIJKL", new[] { "D", "F", "E", "K", "I", "A", "J", "L" } },
        { "ADEFHJKL", new[] { "D", "F", "H", "K", "E", "A", "J", "L" } },
        { "ADEFHIKL", new[] { "D", "F", "H", "K", "I", "A", "E", "L" } },
        { "ADEFHIJL", new[] { "D", "F", "H", "I", "E", "A", "J", "L" } },
        { "ADEFHIJK", new[] { "D", "F", "H", "K", "E", "A", "J", "I" } },
        { "ADEFGJKL", new[] { "D", "F", "E", "K", "J", "A", "G", "L" } },
        { "ADEFGIKL", new[] { "D", "F", "E", "K", "I", "A", "G", "L" } },
        { "ADEFGIJL", new[] { "D", "F", "E", "I", "J", "A", "G", "L" } },
        { "ADEFGIJK", new[] { "D", "F", "E", "K", "J", "A", "G", "I" } },
        { "ADEFGHKL", new[] { "D", "F", "H", "K", "E", "A", "G", "L" } },
        { "ADEFGHJL", new[] { "D", "F", "H", "E", "J", "A", "G", "L" } },
        { "ADEFGHJK", new[] { "D", "F", "H", "K", "J", "A", "G", "E" } },
        { "ADEFGHIL", new[] { "D", "F", "H", "I", "E", "A", "G", "L" } },
        { "ADEFGHIK", new[] { "D", "F", "H", "K", "E", "A", "G", "I" } },
        { "ADEFGHIJ", new[] { "D", "F", "H", "I", "J", "A", "G", "E" } },
        { "ACGHIJKL", new[] { "C", "G", "H", "K", "I", "A", "J", "L" } },
        { "ACFHIJKL", new[] { "C", "F", "H", "K", "I", "A", "J", "L" } },
        { "ACFGIJKL", new[] { "C", "F", "I", "K", "J", "A", "G", "L" } },
        { "ACFGHJKL", new[] { "C", "F", "H", "K", "J", "A", "G", "L" } },
        { "ACFGHIKL", new[] { "C", "F", "H", "K", "I", "A", "G", "L" } },
        { "ACFGHIJL", new[] { "C", "F", "H", "I", "J", "A", "G", "L" } },
        { "ACFGHIJK", new[] { "C", "F", "H", "K", "J", "A", "G", "I" } },
        { "ACEHIJKL", new[] { "C", "H", "E", "K", "I", "A", "J", "L" } },
        { "ACEGIJKL", new[] { "C", "G", "E", "K", "I", "A", "J", "L" } },
        { "ACEGHJKL", new[] { "C", "H", "E", "K", "J", "A", "G", "L" } },
        { "ACEGHIKL", new[] { "C", "H", "E", "K", "I", "A", "G", "L" } },
        { "ACEGHIJL", new[] { "C", "H", "E", "I", "J", "A", "G", "L" } },
        { "ACEGHIJK", new[] { "C", "H", "E", "K", "J", "A", "G", "I" } },
        { "ACEFIJKL", new[] { "C", "F", "E", "K", "I", "A", "J", "L" } },
        { "ACEFHJKL", new[] { "C", "F", "H", "K", "E", "A", "J", "L" } },
        { "ACEFHIKL", new[] { "C", "F", "H", "K", "I", "A", "E", "L" } },
        { "ACEFHIJL", new[] { "C", "F", "H", "I", "E", "A", "J", "L" } },
        { "ACEFHIJK", new[] { "C", "F", "H", "K", "E", "A", "J", "I" } },
        { "ACEFGJKL", new[] { "C", "F", "E", "K", "J", "A", "G", "L" } },
        { "ACEFGIKL", new[] { "C", "F", "E", "K", "I", "A", "G", "L" } },
        { "ACEFGIJL", new[] { "C", "F", "E", "I", "J", "A", "G", "L" } },
        { "ACEFGIJK", new[] { "C", "F", "E", "K", "J", "A", "G", "I" } },
        { "ACEFGHKL", new[] { "C", "F", "H", "K", "E", "A", "G", "L" } },
        { "ACEFGHJL", new[] { "C", "F", "H", "E", "J", "A", "G", "L" } },
        { "ACEFGHJK", new[] { "C", "F", "H", "K", "J", "A", "G", "E" } },
        { "ACEFGHIL", new[] { "C", "F", "H", "I", "E", "A", "G", "L" } },
        { "ACEFGHIK", new[] { "C", "F", "H", "K", "E", "A", "G", "I" } },
        { "ACEFGHIJ", new[] { "C", "F", "H", "I", "J", "A", "G", "E" } },
        { "ACDHIJKL", new[] { "C", "D", "H", "K", "I", "A", "J", "L" } },
        { "ACDGIJKL", new[] { "C", "D", "I", "K", "J", "A", "G", "L" } },
        { "ACDGHJKL", new[] { "C", "D", "H", "K", "J", "A", "G", "L" } },
        { "ACDGHIKL", new[] { "C", "D", "H", "K", "I", "A", "G", "L" } },
        { "ACDGHIJL", new[] { "C", "D", "H", "I", "J", "A", "G", "L" } },
        { "ACDGHIJK", new[] { "C", "D", "H", "K", "J", "A", "G", "I" } },
        { "ACDFIJKL", new[] { "D", "F", "C", "K", "I", "A", "J", "L" } },
        { "ACDFHJKL", new[] { "C", "D", "H", "K", "F", "A", "J", "L" } },
        { "ACDFHIKL", new[] { "C", "D", "H", "K", "I", "A", "F", "L" } },
        { "ACDFHIJL", new[] { "C", "D", "H", "I", "F", "A", "J", "L" } },
        { "ACDFHIJK", new[] { "C", "D", "H", "K", "F", "A", "J", "I" } },
        { "ACDFGJKL", new[] { "D", "F", "C", "K", "J", "A", "G", "L" } },
        { "ACDFGIKL", new[] { "D", "F", "C", "K", "I", "A", "G", "L" } },
        { "ACDFGIJL", new[] { "D", "F", "C", "I", "J", "A", "G", "L" } },
        { "ACDFGIJK", new[] { "D", "F", "C", "K", "J", "A", "G", "I" } },
        { "ACDFGHKL", new[] { "C", "D", "H", "K", "F", "A", "G", "L" } },
        { "ACDFGHJL", new[] { "D", "F", "C", "H", "J", "A", "G", "L" } },
        { "ACDFGHJK", new[] { "C", "F", "H", "K", "J", "A", "G", "D" } },
        { "ACDFGHIL", new[] { "C", "D", "H", "I", "F", "A", "G", "L" } },
        { "ACDFGHIK", new[] { "C", "D", "H", "K", "F", "A", "G", "I" } },
        { "ACDFGHIJ", new[] { "C", "F", "H", "I", "J", "A", "G", "D" } },
        { "ACDEIJKL", new[] { "C", "D", "E", "K", "I", "A", "J", "L" } },
        { "ACDEHJKL", new[] { "C", "D", "H", "K", "E", "A", "J", "L" } },
        { "ACDEHIKL", new[] { "C", "D", "H", "K", "I", "A", "E", "L" } },
        { "ACDEHIJL", new[] { "C", "D", "H", "I", "E", "A", "J", "L" } },
        { "ACDEHIJK", new[] { "C", "D", "H", "K", "E", "A", "J", "I" } },
        { "ACDEGJKL", new[] { "C", "D", "E", "K", "J", "A", "G", "L" } },
        { "ACDEGIKL", new[] { "C", "D", "E", "K", "I", "A", "G", "L" } },
        { "ACDEGIJL", new[] { "C", "D", "E", "I", "J", "A", "G", "L" } },
        { "ACDEGIJK", new[] { "C", "D", "E", "K", "J", "A", "G", "I" } },
        { "ACDEGHKL", new[] { "C", "D", "H", "K", "E", "A", "G", "L" } },
        { "ACDEGHJL", new[] { "C", "D", "H", "E", "J", "A", "G", "L" } },
        { "ACDEGHJK", new[] { "C", "D", "H", "K", "J", "A", "G", "E" } },
        { "ACDEGHIL", new[] { "C", "D", "H", "I", "E", "A", "G", "L" } },
        { "ACDEGHIK", new[] { "C", "D", "H", "K", "E", "A", "G", "I" } },
        { "ACDEGHIJ", new[] { "C", "D", "H", "I", "J", "A", "G", "E" } },
        { "ACDEFJKL", new[] { "D", "F", "C", "K", "E", "A", "J", "L" } },
        { "ACDEFIKL", new[] { "D", "F", "C", "K", "I", "A", "E", "L" } },
        { "ACDEFIJL", new[] { "D", "F", "C", "I", "E", "A", "J", "L" } },
        { "ACDEFIJK", new[] { "D", "F", "C", "K", "E", "A", "J", "I" } },
        { "ACDEFHKL", new[] { "C", "D", "H", "K", "F", "A", "E", "L" } },
        { "ACDEFHJL", new[] { "C", "D", "H", "E", "F", "A", "J", "L" } },
        { "ACDEFHJK", new[] { "C", "F", "H", "K", "E", "A", "J", "D" } },
        { "ACDEFHIL", new[] { "C", "D", "H", "I", "F", "A", "E", "L" } },
        { "ACDEFHIK", new[] { "C", "D", "H", "K", "F", "A", "E", "I" } },
        { "ACDEFHIJ", new[] { "C", "F", "H", "I", "E", "A", "J", "D" } },
        { "ACDEFGKL", new[] { "D", "F", "C", "K", "E", "A", "G", "L" } },
        { "ACDEFGJL", new[] { "D", "F", "C", "E", "J", "A", "G", "L" } },
        { "ACDEFGJK", new[] { "D", "F", "C", "K", "J", "A", "G", "E" } },
        { "ACDEFGIL", new[] { "D", "F", "C", "I", "E", "A", "G", "L" } },
        { "ACDEFGIK", new[] { "D", "F", "C", "K", "E", "A", "G", "I" } },
        { "ACDEFGIJ", new[] { "D", "F", "C", "I", "J", "A", "G", "E" } },
        { "ACDEFGHL", new[] { "C", "D", "H", "E", "F", "A", "G", "L" } },
        { "ACDEFGHK", new[] { "C", "F", "H", "K", "E", "A", "G", "D" } },
        { "ACDEFGHJ", new[] { "C", "F", "H", "E", "J", "A", "G", "D" } },
        { "ACDEFGHI", new[] { "C", "F", "H", "I", "E", "A", "G", "D" } },
        { "ABGHIJKL", new[] { "A", "G", "H", "K", "B", "I", "J", "L" } },
        { "ABFHIJKL", new[] { "A", "F", "H", "K", "B", "I", "J", "L" } },
        { "ABFGIJKL", new[] { "F", "G", "I", "K", "B", "A", "J", "L" } },
        { "ABFGHJKL", new[] { "F", "G", "H", "K", "B", "A", "J", "L" } },
        { "ABFGHIKL", new[] { "A", "F", "H", "K", "B", "I", "G", "L" } },
        { "ABFGHIJL", new[] { "F", "G", "H", "I", "B", "A", "J", "L" } },
        { "ABFGHIJK", new[] { "F", "G", "H", "K", "B", "A", "J", "I" } },
        { "ABEHIJKL", new[] { "A", "H", "E", "K", "B", "I", "J", "L" } },
        { "ABEGIJKL", new[] { "A", "G", "E", "K", "B", "I", "J", "L" } },
        { "ABEGHJKL", new[] { "A", "G", "E", "K", "B", "H", "J", "L" } },
        { "ABEGHIKL", new[] { "A", "H", "E", "K", "B", "I", "G", "L" } },
        { "ABEGHIJL", new[] { "A", "G", "E", "I", "B", "H", "J", "L" } },
        { "ABEGHIJK", new[] { "A", "G", "E", "K", "B", "H", "J", "I" } },
        { "ABEFIJKL", new[] { "A", "F", "E", "K", "B", "I", "J", "L" } },
        { "ABEFHJKL", new[] { "F", "H", "E", "K", "B", "A", "J", "L" } },
        { "ABEFHIKL", new[] { "F", "H", "E", "K", "B", "A", "I", "L" } },
        { "ABEFHIJL", new[] { "F", "H", "E", "I", "B", "A", "J", "L" } },
        { "ABEFHIJK", new[] { "F", "H", "E", "K", "B", "A", "J", "I" } },
        { "ABEFGJKL", new[] { "F", "G", "E", "K", "B", "A", "J", "L" } },
        { "ABEFGIKL", new[] { "A", "F", "E", "K", "B", "I", "G", "L" } },
        { "ABEFGIJL", new[] { "F", "G", "E", "I", "B", "A", "J", "L" } },
        { "ABEFGIJK", new[] { "F", "G", "E", "K", "B", "A", "J", "I" } },
        { "ABEFGHKL", new[] { "F", "H", "E", "K", "B", "A", "G", "L" } },
        { "ABEFGHJL", new[] { "F", "G", "H", "E", "B", "A", "J", "L" } },
        { "ABEFGHJK", new[] { "F", "G", "H", "K", "B", "A", "J", "E" } },
        { "ABEFGHIL", new[] { "F", "H", "E", "I", "B", "A", "G", "L" } },
        { "ABEFGHIK", new[] { "F", "H", "E", "K", "B", "A", "G", "I" } },
        { "ABEFGHIJ", new[] { "F", "G", "H", "I", "B", "A", "J", "E" } },
        { "ABDHIJKL", new[] { "D", "H", "I", "K", "B", "A", "J", "L" } },
        { "ABDGIJKL", new[] { "D", "G", "I", "K", "B", "A", "J", "L" } },
        { "ABDGHJKL", new[] { "D", "G", "H", "K", "B", "A", "J", "L" } },
        { "ABDGHIKL", new[] { "D", "H", "I", "K", "B", "A", "G", "L" } },
        { "ABDGHIJL", new[] { "D", "G", "H", "I", "B", "A", "J", "L" } },
        { "ABDGHIJK", new[] { "D", "G", "H", "K", "B", "A", "J", "I" } },
        { "ABDFIJKL", new[] { "D", "F", "I", "K", "B", "A", "J", "L" } },
        { "ABDFHJKL", new[] { "D", "F", "H", "K", "B", "A", "J", "L" } },
        { "ABDFHIKL", new[] { "D", "F", "H", "K", "B", "A", "I", "L" } },
        { "ABDFHIJL", new[] { "D", "F", "H", "I", "B", "A", "J", "L" } },
        { "ABDFHIJK", new[] { "D", "F", "H", "K", "B", "A", "J", "I" } },
        { "ABDFGJKL", new[] { "D", "G", "F", "K", "B", "A", "J", "L" } },
        { "ABDFGIKL", new[] { "D", "F", "I", "K", "B", "A", "G", "L" } },
        { "ABDFGIJL", new[] { "D", "G", "F", "I", "B", "A", "J", "L" } },
        { "ABDFGIJK", new[] { "D", "G", "F", "K", "B", "A", "J", "I" } },
        { "ABDFGHKL", new[] { "D", "F", "H", "K", "B", "A", "G", "L" } },
        { "ABDFGHJL", new[] { "D", "F", "H", "J", "B", "A", "G", "L" } },
        { "ABDFGHJK", new[] { "D", "F", "H", "K", "B", "A", "G", "J" } },
        { "ABDFGHIL", new[] { "D", "F", "H", "I", "B", "A", "G", "L" } },
        { "ABDFGHIK", new[] { "D", "F", "H", "K", "B", "A", "G", "I" } },
        { "ABDFGHIJ", new[] { "D", "F", "H", "J", "B", "A", "G", "I" } },
        { "ABDEIJKL", new[] { "A", "D", "E", "K", "B", "I", "J", "L" } },
        { "ABDEHJKL", new[] { "D", "H", "E", "K", "B", "A", "J", "L" } },
        { "ABDEHIKL", new[] { "D", "H", "E", "K", "B", "A", "I", "L" } },
        { "ABDEHIJL", new[] { "D", "H", "E", "I", "B", "A", "J", "L" } },
        { "ABDEHIJK", new[] { "D", "H", "E", "K", "B", "A", "J", "I" } },
        { "ABDEGJKL", new[] { "D", "G", "E", "K", "B", "A", "J", "L" } },
        { "ABDEGIKL", new[] { "A", "D", "E", "K", "B", "I", "G", "L" } },
        { "ABDEGIJL", new[] { "D", "G", "E", "I", "B", "A", "J", "L" } },
        { "ABDEGIJK", new[] { "D", "G", "E", "K", "B", "A", "J", "I" } },
        { "ABDEGHKL", new[] { "D", "H", "E", "K", "B", "A", "G", "L" } },
        { "ABDEGHJL", new[] { "D", "G", "H", "E", "B", "A", "J", "L" } },
        { "ABDEGHJK", new[] { "D", "G", "H", "K", "B", "A", "J", "E" } },
        { "ABDEGHIL", new[] { "D", "H", "E", "I", "B", "A", "G", "L" } },
        { "ABDEGHIK", new[] { "D", "H", "E", "K", "B", "A", "G", "I" } },
        { "ABDEGHIJ", new[] { "D", "G", "H", "I", "B", "A", "J", "E" } },
        { "ABDEFJKL", new[] { "D", "F", "E", "K", "B", "A", "J", "L" } },
        { "ABDEFIKL", new[] { "D", "F", "E", "K", "B", "A", "I", "L" } },
        { "ABDEFIJL", new[] { "D", "F", "E", "I", "B", "A", "J", "L" } },
        { "ABDEFIJK", new[] { "D", "F", "E", "K", "B", "A", "J", "I" } },
        { "ABDEFHKL", new[] { "D", "F", "H", "K", "B", "A", "E", "L" } },
        { "ABDEFHJL", new[] { "D", "F", "H", "E", "B", "A", "J", "L" } },
        { "ABDEFHJK", new[] { "D", "F", "H", "K", "B", "A", "J", "E" } },
        { "ABDEFHIL", new[] { "D", "F", "H", "I", "B", "A", "E", "L" } },
        { "ABDEFHIK", new[] { "D", "F", "H", "K", "B", "A", "E", "I" } },
        { "ABDEFHIJ", new[] { "D", "F", "H", "I", "B", "A", "J", "E" } },
        { "ABDEFGKL", new[] { "D", "F", "E", "K", "B", "A", "G", "L" } },
        { "ABDEFGJL", new[] { "D", "F", "E", "J", "B", "A", "G", "L" } },
        { "ABDEFGJK", new[] { "D", "F", "E", "K", "B", "A", "G", "J" } },
        { "ABDEFGIL", new[] { "D", "F", "E", "I", "B", "A", "G", "L" } },
        { "ABDEFGIK", new[] { "D", "F", "E", "K", "B", "A", "G", "I" } },
        { "ABDEFGIJ", new[] { "D", "F", "E", "J", "B", "A", "G", "I" } },
        { "ABDEFGHL", new[] { "D", "F", "H", "E", "B", "A", "G", "L" } },
        { "ABDEFGHK", new[] { "D", "F", "H", "K", "B", "A", "G", "E" } },
        { "ABDEFGHJ", new[] { "D", "F", "H", "J", "B", "A", "G", "E" } },
        { "ABDEFGHI", new[] { "D", "F", "H", "I", "B", "A", "G", "E" } },
        { "ABCHIJKL", new[] { "C", "H", "I", "K", "B", "A", "J", "L" } },
        { "ABCGIJKL", new[] { "C", "G", "I", "K", "B", "A", "J", "L" } },
        { "ABCGHJKL", new[] { "C", "G", "H", "K", "B", "A", "J", "L" } },
        { "ABCGHIKL", new[] { "C", "H", "I", "K", "B", "A", "G", "L" } },
        { "ABCGHIJL", new[] { "C", "G", "H", "I", "B", "A", "J", "L" } },
        { "ABCGHIJK", new[] { "C", "G", "H", "K", "B", "A", "J", "I" } },
        { "ABCFIJKL", new[] { "C", "F", "I", "K", "B", "A", "J", "L" } },
        { "ABCFHJKL", new[] { "C", "F", "H", "K", "B", "A", "J", "L" } },
        { "ABCFHIKL", new[] { "C", "F", "H", "K", "B", "A", "I", "L" } },
        { "ABCFHIJL", new[] { "C", "F", "H", "I", "B", "A", "J", "L" } },
        { "ABCFHIJK", new[] { "C", "F", "H", "K", "B", "A", "J", "I" } },
        { "ABCFGJKL", new[] { "F", "G", "C", "K", "B", "A", "J", "L" } },
        { "ABCFGIKL", new[] { "C", "F", "I", "K", "B", "A", "G", "L" } },
        { "ABCFGIJL", new[] { "F", "G", "C", "I", "B", "A", "J", "L" } },
        { "ABCFGIJK", new[] { "F", "G", "C", "K", "B", "A", "J", "I" } },
        { "ABCFGHKL", new[] { "C", "F", "H", "K", "B", "A", "G", "L" } },
        { "ABCFGHJL", new[] { "C", "F", "H", "J", "B", "A", "G", "L" } },
        { "ABCFGHJK", new[] { "C", "F", "H", "K", "B", "A", "G", "J" } },
        { "ABCFGHIL", new[] { "C", "F", "H", "I", "B", "A", "G", "L" } },
        { "ABCFGHIK", new[] { "C", "F", "H", "K", "B", "A", "G", "I" } },
        { "ABCFGHIJ", new[] { "C", "F", "H", "J", "B", "A", "G", "I" } },
        { "ABCEIJKL", new[] { "A", "C", "E", "K", "B", "I", "J", "L" } },
        { "ABCEHJKL", new[] { "C", "H", "E", "K", "B", "A", "J", "L" } },
        { "ABCEHIKL", new[] { "C", "H", "E", "K", "B", "A", "I", "L" } },
        { "ABCEHIJL", new[] { "C", "H", "E", "I", "B", "A", "J", "L" } },
        { "ABCEHIJK", new[] { "C", "H", "E", "K", "B", "A", "J", "I" } },
        { "ABCEGJKL", new[] { "C", "G", "E", "K", "B", "A", "J", "L" } },
        { "ABCEGIKL", new[] { "A", "C", "E", "K", "B", "I", "G", "L" } },
        { "ABCEGIJL", new[] { "C", "G", "E", "I", "B", "A", "J", "L" } },
        { "ABCEGIJK", new[] { "C", "G", "E", "K", "B", "A", "J", "I" } },
        { "ABCEGHKL", new[] { "C", "H", "E", "K", "B", "A", "G", "L" } },
        { "ABCEGHJL", new[] { "C", "G", "H", "E", "B", "A", "J", "L" } },
        { "ABCEGHJK", new[] { "C", "G", "H", "K", "B", "A", "J", "E" } },
        { "ABCEGHIL", new[] { "C", "H", "E", "I", "B", "A", "G", "L" } },
        { "ABCEGHIK", new[] { "C", "H", "E", "K", "B", "A", "G", "I" } },
        { "ABCEGHIJ", new[] { "C", "G", "H", "I", "B", "A", "J", "E" } },
        { "ABCEFJKL", new[] { "C", "F", "E", "K", "B", "A", "J", "L" } },
        { "ABCEFIKL", new[] { "C", "F", "E", "K", "B", "A", "I", "L" } },
        { "ABCEFIJL", new[] { "C", "F", "E", "I", "B", "A", "J", "L" } },
        { "ABCEFIJK", new[] { "C", "F", "E", "K", "B", "A", "J", "I" } },
        { "ABCEFHKL", new[] { "C", "F", "H", "K", "B", "A", "E", "L" } },
        { "ABCEFHJL", new[] { "C", "F", "H", "E", "B", "A", "J", "L" } },
        { "ABCEFHJK", new[] { "C", "F", "H", "K", "B", "A", "J", "E" } },
        { "ABCEFHIL", new[] { "C", "F", "H", "I", "B", "A", "E", "L" } },
        { "ABCEFHIK", new[] { "C", "F", "H", "K", "B", "A", "E", "I" } },
        { "ABCEFHIJ", new[] { "C", "F", "H", "I", "B", "A", "J", "E" } },
        { "ABCEFGKL", new[] { "C", "F", "E", "K", "B", "A", "G", "L" } },
        { "ABCEFGJL", new[] { "C", "F", "E", "J", "B", "A", "G", "L" } },
        { "ABCEFGJK", new[] { "C", "F", "E", "K", "B", "A", "G", "J" } },
        { "ABCEFGIL", new[] { "C", "F", "E", "I", "B", "A", "G", "L" } },
        { "ABCEFGIK", new[] { "C", "F", "E", "K", "B", "A", "G", "I" } },
        { "ABCEFGIJ", new[] { "C", "F", "E", "J", "B", "A", "G", "I" } },
        { "ABCEFGHL", new[] { "C", "F", "H", "E", "B", "A", "G", "L" } },
        { "ABCEFGHK", new[] { "C", "F", "H", "K", "B", "A", "G", "E" } },
        { "ABCEFGHJ", new[] { "C", "F", "H", "J", "B", "A", "G", "E" } },
        { "ABCEFGHI", new[] { "C", "F", "H", "I", "B", "A", "G", "E" } },
        { "ABCDIJKL", new[] { "C", "D", "I", "K", "B", "A", "J", "L" } },
        { "ABCDHJKL", new[] { "C", "D", "H", "K", "B", "A", "J", "L" } },
        { "ABCDHIKL", new[] { "C", "D", "H", "K", "B", "A", "I", "L" } },
        { "ABCDHIJL", new[] { "C", "D", "H", "I", "B", "A", "J", "L" } },
        { "ABCDHIJK", new[] { "C", "D", "H", "K", "B", "A", "J", "I" } },
        { "ABCDGJKL", new[] { "D", "G", "C", "K", "B", "A", "J", "L" } },
        { "ABCDGIKL", new[] { "C", "D", "I", "K", "B", "A", "G", "L" } },
        { "ABCDGIJL", new[] { "D", "G", "C", "I", "B", "A", "J", "L" } },
        { "ABCDGIJK", new[] { "D", "G", "C", "K", "B", "A", "J", "I" } },
        { "ABCDGHKL", new[] { "C", "D", "H", "K", "B", "A", "G", "L" } },
        { "ABCDGHJL", new[] { "C", "D", "H", "J", "B", "A", "G", "L" } },
        { "ABCDGHJK", new[] { "C", "D", "H", "K", "B", "A", "G", "J" } },
        { "ABCDGHIL", new[] { "C", "D", "H", "I", "B", "A", "G", "L" } },
        { "ABCDGHIK", new[] { "C", "D", "H", "K", "B", "A", "G", "I" } },
        { "ABCDGHIJ", new[] { "C", "D", "H", "J", "B", "A", "G", "I" } },
        { "ABCDFJKL", new[] { "D", "F", "C", "K", "B", "A", "J", "L" } },
        { "ABCDFIKL", new[] { "D", "F", "C", "K", "B", "A", "I", "L" } },
        { "ABCDFIJL", new[] { "D", "F", "C", "I", "B", "A", "J", "L" } },
        { "ABCDFIJK", new[] { "D", "F", "C", "K", "B", "A", "J", "I" } },
        { "ABCDFHKL", new[] { "C", "D", "H", "K", "B", "A", "F", "L" } },
        { "ABCDFHJL", new[] { "D", "F", "C", "H", "B", "A", "J", "L" } },
        { "ABCDFHJK", new[] { "C", "F", "H", "K", "B", "A", "J", "D" } },
        { "ABCDFHIL", new[] { "C", "D", "H", "I", "B", "A", "F", "L" } },
        { "ABCDFHIK", new[] { "C", "D", "H", "K", "B", "A", "F", "I" } },
        { "ABCDFHIJ", new[] { "C", "F", "H", "I", "B", "A", "J", "D" } },
        { "ABCDFGKL", new[] { "D", "F", "C", "K", "B", "A", "G", "L" } },
        { "ABCDFGJL", new[] { "D", "F", "C", "J", "B", "A", "G", "L" } },
        { "ABCDFGJK", new[] { "D", "F", "C", "K", "B", "A", "G", "J" } },
        { "ABCDFGIL", new[] { "D", "F", "C", "I", "B", "A", "G", "L" } },
        { "ABCDFGIK", new[] { "D", "F", "C", "K", "B", "A", "G", "I" } },
        { "ABCDFGIJ", new[] { "D", "F", "C", "J", "B", "A", "G", "I" } },
        { "ABCDFGHL", new[] { "D", "F", "C", "H", "B", "A", "G", "L" } },
        { "ABCDFGHK", new[] { "C", "F", "H", "K", "B", "A", "G", "D" } },
        { "ABCDFGHJ", new[] { "C", "F", "H", "J", "B", "A", "G", "D" } },
        { "ABCDFGHI", new[] { "C", "F", "H", "I", "B", "A", "G", "D" } },
        { "ABCDEJKL", new[] { "C", "D", "E", "K", "B", "A", "J", "L" } },
        { "ABCDEIKL", new[] { "C", "D", "E", "K", "B", "A", "I", "L" } },
        { "ABCDEIJL", new[] { "C", "D", "E", "I", "B", "A", "J", "L" } },
        { "ABCDEIJK", new[] { "C", "D", "E", "K", "B", "A", "J", "I" } },
        { "ABCDEHKL", new[] { "C", "D", "H", "K", "B", "A", "E", "L" } },
        { "ABCDEHJL", new[] { "C", "D", "H", "E", "B", "A", "J", "L" } },
        { "ABCDEHJK", new[] { "C", "D", "H", "K", "B", "A", "J", "E" } },
        { "ABCDEHIL", new[] { "C", "D", "H", "I", "B", "A", "E", "L" } },
        { "ABCDEHIK", new[] { "C", "D", "H", "K", "B", "A", "E", "I" } },
        { "ABCDEHIJ", new[] { "C", "D", "H", "I", "B", "A", "J", "E" } },
        { "ABCDEGKL", new[] { "C", "D", "E", "K", "B", "A", "G", "L" } },
        { "ABCDEGJL", new[] { "C", "D", "E", "J", "B", "A", "G", "L" } },
        { "ABCDEGJK", new[] { "C", "D", "E", "K", "B", "A", "G", "J" } },
        { "ABCDEGIL", new[] { "C", "D", "E", "I", "B", "A", "G", "L" } },
        { "ABCDEGIK", new[] { "C", "D", "E", "K", "B", "A", "G", "I" } },
        { "ABCDEGIJ", new[] { "C", "D", "E", "J", "B", "A", "G", "I" } },
        { "ABCDEGHL", new[] { "C", "D", "H", "E", "B", "A", "G", "L" } },
        { "ABCDEGHK", new[] { "C", "D", "H", "K", "B", "A", "G", "E" } },
        { "ABCDEGHJ", new[] { "C", "D", "H", "J", "B", "A", "G", "E" } },
        { "ABCDEGHI", new[] { "C", "D", "H", "I", "B", "A", "G", "E" } },
        { "ABCDEFKL", new[] { "D", "F", "C", "K", "B", "A", "E", "L" } },
        { "ABCDEFJL", new[] { "D", "F", "C", "E", "B", "A", "J", "L" } },
        { "ABCDEFJK", new[] { "D", "F", "C", "K", "B", "A", "J", "E" } },
        { "ABCDEFIL", new[] { "D", "F", "C", "I", "B", "A", "E", "L" } },
        { "ABCDEFIK", new[] { "D", "F", "C", "K", "B", "A", "E", "I" } },
        { "ABCDEFIJ", new[] { "D", "F", "C", "I", "B", "A", "J", "E" } },
        { "ABCDEFHL", new[] { "C", "D", "H", "E", "B", "A", "F", "L" } },
        { "ABCDEFHK", new[] { "C", "F", "H", "K", "B", "A", "E", "D" } },
        { "ABCDEFHJ", new[] { "C", "F", "H", "E", "B", "A", "J", "D" } },
        { "ABCDEFHI", new[] { "C", "F", "H", "I", "B", "A", "E", "D" } },
        { "ABCDEFGL", new[] { "D", "F", "C", "E", "B", "A", "G", "L" } },
        { "ABCDEFGK", new[] { "D", "F", "C", "K", "B", "A", "G", "E" } },
        { "ABCDEFGJ", new[] { "D", "F", "C", "J", "B", "A", "G", "E" } },
        { "ABCDEFGI", new[] { "D", "F", "C", "I", "B", "A", "G", "E" } },
        { "ABCDEFGH", new[] { "C", "F", "H", "E", "B", "A", "G", "D" } },
    };

    public async Task<int> Handle(GenerateKnockoutBracketCommand request, CancellationToken ct)
    {
        var allMatches = (await matchRepository.GetAllAsync(ct)).ToList();

        var standings = ComputeGroupStandings(allMatches);
        if (standings.Count == 0)
        {
            logger.LogWarning("No hay resultados de fase de grupos para generar eliminatorias.");
            return 0;
        }

        var firstPlace  = new Dictionary<string, QualifiedTeam>();
        var secondPlace = new Dictionary<string, QualifiedTeam>();
        var thirdPlace  = new List<QualifiedTeam>();

        foreach (var (group, teams) in standings)
        {
            if (teams.Count >= 1) firstPlace[group]  = teams[0];
            if (teams.Count >= 2) secondPlace[group] = teams[1];
            if (teams.Count >= 3) thirdPlace.Add(teams[2] with { Group = group });
        }

        var best8Third = thirdPlace
            .OrderByDescending(t => t.Pts)
            .ThenByDescending(t => t.Gd)
            .ThenByDescending(t => t.Gf)
            .Take(8)
            .ToList();

        var groupKey = string.Concat(best8Third.Select(t => t.Group).Order());
        var slotNames = new[] { "P74", "P77", "P79", "P80", "P81", "P82", "P85", "P87" };
        var thirdAssignments = new Dictionary<string, QualifiedTeam?>();

        if (ThirdPlaceLookup.TryGetValue(groupKey, out var slotGroups))
        {
            var teamByGroup = best8Third.ToDictionary(t => t.Group);
            for (int i = 0; i < slotNames.Length; i++)
                thirdAssignments[slotNames[i]] = teamByGroup.TryGetValue(slotGroups[i], out var team) ? team : null;
        }
        else
        {
            logger.LogWarning("Combinacion de terceros {Key} no encontrada en tabla de lookup", groupKey);
            foreach (var k in slotNames) thirdAssignments[k] = null;
        }

        int updated = 0;
        var r32Map = BuildR32Map(firstPlace, secondPlace, thirdAssignments);

        foreach (var (slotId, assignment) in r32Map)
        {
            var match = allMatches.FirstOrDefault(m =>
                m.Stage == "Round of 32" && m.HomeTeam.StartsWith(slotId));

            if (match is null)
            {
                logger.LogWarning("Slot {Slot} no encontrado en DB", slotId);
                continue;
            }

            match.SetTeams(assignment.Home, assignment.Away, assignment.HomeFlagUrl, assignment.AwayFlagUrl);
            matchRepository.Update(match);
            updated++;
        }

        await unitOfWork.SaveChangesAsync(ct);
        logger.LogInformation("Bracket generado: {Updated} partidos actualizados", updated);
        return updated;
    }

    private static Dictionary<string, List<QualifiedTeam>> ComputeGroupStandings(List<Match> allMatches)
    {
        var tables = new Dictionary<string, Dictionary<string, StandingRow>>();

        foreach (var m in allMatches.Where(m => m.Stage == "Group Stage" && m.Status == MatchStatus.Finished && m.GroupName != null))
        {
            var g = m.GroupName!;
            tables.TryAdd(g, new Dictionary<string, StandingRow>());
            tables[g].TryAdd(m.HomeTeam, new StandingRow(m.HomeTeam, m.HomeFlagUrl));
            tables[g].TryAdd(m.AwayTeam, new StandingRow(m.AwayTeam, m.AwayFlagUrl));

            var home = tables[g][m.HomeTeam];
            var away = tables[g][m.AwayTeam];

            home.P++; away.P++;
            home.Gf += m.Score.HomeGoals; home.Ga += m.Score.AwayGoals;
            away.Gf += m.Score.AwayGoals; away.Ga += m.Score.HomeGoals;

            if (m.Score.HomeGoals > m.Score.AwayGoals) { home.W++; away.L++; home.Pts += 3; }
            else if (m.Score.HomeGoals < m.Score.AwayGoals) { away.W++; home.L++; away.Pts += 3; }
            else { home.D++; away.D++; home.Pts++; away.Pts++; }
        }

        return tables.ToDictionary(
            kv => kv.Key,
            kv => kv.Value.Values
                .OrderByDescending(t => t.Pts)
                .ThenByDescending(t => t.Gf - t.Ga)
                .ThenByDescending(t => t.Gf)
                .Select(t => new QualifiedTeam(t.Name, t.FlagUrl, kv.Key, t.Pts, t.Gf - t.Ga, t.Gf))
                .ToList());
    }

    private static Dictionary<string, (string Home, string Away, string? HomeFlagUrl, string? AwayFlagUrl)> BuildR32Map(
        Dictionary<string, QualifiedTeam> first,
        Dictionary<string, QualifiedTeam> second,
        Dictionary<string, QualifiedTeam?> third)
    {
        QualifiedTeam? F(string g) => first.TryGetValue(g, out var t) ? t : null;
        QualifiedTeam? S(string g) => second.TryGetValue(g, out var t) ? t : null;
        QualifiedTeam? T(string slot) => third.TryGetValue(slot, out var t) ? t : null;

        (string, string, string?, string?) Pair(QualifiedTeam? h, QualifiedTeam? a) =>
            (h?.Name ?? "TBD", a?.Name ?? "TBD", h?.FlagUrl, a?.FlagUrl);

        return new Dictionary<string, (string, string, string?, string?)>
        {
            ["P73"] = Pair(S("A"), S("B")),
            ["P74"] = Pair(F("E"), T("P74")),
            ["P75"] = Pair(F("F"), S("C")),
            ["P76"] = Pair(F("C"), S("F")),
            ["P77"] = Pair(F("I"), T("P77")),
            ["P78"] = Pair(S("E"), S("I")),
            ["P79"] = Pair(F("A"), T("P79")),
            ["P80"] = Pair(F("L"), T("P80")),
            ["P81"] = Pair(F("D"), T("P81")),
            ["P82"] = Pair(F("G"), T("P82")),
            ["P83"] = Pair(S("K"), S("L")),
            ["P84"] = Pair(F("H"), S("J")),
            ["P85"] = Pair(F("B"), T("P85")),
            ["P86"] = Pair(F("J"), S("H")),
            ["P87"] = Pair(F("K"), T("P87")),
            ["P88"] = Pair(S("D"), S("G")),
        };
    }

    private class StandingRow(string name, string? flagUrl)
    {
        public string Name { get; } = name;
        public string? FlagUrl { get; } = flagUrl;
        public int P, W, D, L, Gf, Ga, Pts;
    }

    private record QualifiedTeam(string Name, string? FlagUrl, string Group, int Pts, int Gd, int Gf);
}