using Microsoft.AspNetCore.Mvc;

namespace WorldCup.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfigController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public ConfigController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            footballApiKey = _configuration["FootballApi:ApiKey"] ?? string.Empty
        });
    }
}
