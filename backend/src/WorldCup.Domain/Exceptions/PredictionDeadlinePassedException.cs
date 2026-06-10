namespace WorldCup.Domain.Exceptions;

public class PredictionDeadlinePassedException(string message) : Exception(message);
