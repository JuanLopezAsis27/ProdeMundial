FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY WorldCup.slnx .
COPY src/WorldCup.Domain/WorldCup.Domain.csproj src/WorldCup.Domain/
COPY src/WorldCup.Application/WorldCup.Application.csproj src/WorldCup.Application/
COPY src/WorldCup.Infrastructure/WorldCup.Infrastructure.csproj src/WorldCup.Infrastructure/
COPY src/WorldCup.API/WorldCup.API.csproj src/WorldCup.API/
RUN dotnet restore src/WorldCup.API/WorldCup.API.csproj

COPY . .
RUN dotnet publish src/WorldCup.API/WorldCup.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "WorldCup.API.dll"]
