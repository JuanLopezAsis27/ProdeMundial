using System.Text.Json;
using FluentValidation;
using WorldCup.Application.Common.Exceptions;
using WorldCup.Domain.Exceptions;

namespace WorldCup.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            ValidationException ve => (StatusCodes.Status400BadRequest,
                "Validation failed",
                ve.Errors.Select(e => e.ErrorMessage).ToArray()),
            NotFoundException => (StatusCodes.Status404NotFound, exception.Message, Array.Empty<string>()),
            ForbiddenException => (StatusCodes.Status403Forbidden, exception.Message, Array.Empty<string>()),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message, Array.Empty<string>()),
            DomainException => (StatusCodes.Status422UnprocessableEntity, exception.Message, Array.Empty<string>()),
            PredictionDeadlinePassedException => (StatusCodes.Status422UnprocessableEntity, exception.Message, Array.Empty<string>()),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred", Array.Empty<string>())
        };

        context.Response.StatusCode = statusCode;

        var body = JsonSerializer.Serialize(new
        {
            status = statusCode,
            message,
            errors
        });

        return context.Response.WriteAsync(body);
    }
}
