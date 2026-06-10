# ProdeMundial

Aplicación de predicciones de fútbol en tiempo real enfocada en el Mundial 2026 (USA, Canadá y México). Los usuarios pueden registrarse, unirse a grupos, predecir resultados de partidos, acumular puntos y competir en tablas de posiciones.

## 🚀 Visión general

- App full stack con frontend en Angular y backend en .NET 9
- Predicciones por partido y por grupo
- Puntaje en tiempo real cuando un partido termina
- Integración con API de fútbol externa
- Soporte de autenticación con JWT y SignalR para actualizaciones en vivo
- Persistencia con PostgreSQL y cache con Redis
- Contenedores Docker para backend, frontend, base de datos y cache

## 🧱 Stack tecnológico

- Backend: C# / .NET 9
- Frontend: Angular 21+ (Standalone Components)
- Base de datos: PostgreSQL
- ORM: Entity Framework Core
- Tiempo real: SignalR
- Autenticación: ASP.NET Identity + JWT
- API externa: API-Football (RapidAPI)
- Cache: Redis
- Orquestación: Docker Compose

## 📁 Estructura del proyecto

```
ProdeMundial/
├── backend/
│   ├── src/
│   │   ├── WorldCup.API/          # API HTTP + SignalR + Program.cs
│   │   ├── WorldCup.Application/  # Casos de uso, comandos, queries, dto
│   │   ├── WorldCup.Domain/       # Entidades del dominio, value objects, eventos
│   │   └── WorldCup.Infrastructure/ # EF Core, repositorios, servicios externos, SignalR
├── frontend/                     # Aplicación Angular
├── docker-compose.yml           # Definición de servicios (api, frontend, postgres, redis)
└── claude.md                    # Documentación del dominio y arquitectura
```

## 🧠 Arquitectura backend

La solución sigue un enfoque inspirado en Clean Architecture / DDD:

- `WorldCup.Domain`: modelo del dominio, entidades y reglas de negocio.
- `WorldCup.Application`: casos de uso, comandos/queries y validaciones.
- `WorldCup.Infrastructure`: persistencia, integraciones externas, SignalR y configuración.
- `WorldCup.API`: endpoints HTTP, middleware, autenticación, hubs y bootstrap.

### Comportamiento clave

- Predicciones solo se pueden crear antes de la hora de inicio del partido.
- Cada usuario puede registrar una predicción por partido y por grupo.
- El score se calcula cuando termina el partido:
  - Exacto: 3 puntos
  - Ganador/empate correcto: 1 punto
  - Incorrecto: 0 puntos
- Se usan eventos de dominio para notificar puntuaciones y cambios de estado.

## 🌐 Arquitectura frontend

- Angular 21 con componentes standalone
- Servicio SignalR para suscripción a actualizaciones de partidos en vivo
- Rutas para las secciones principales: bienvenida, fixture, grupos, predicciones y autenticación

## 🧩 Funcionalidades principales

- Registro y login de usuarios
- Creación y administración de grupos de predicción
- Listado de partidos del Mundial y fixture completo
- Envío de predicciones antes del inicio del partido
- Puntuación automática de predicciones tras finalizar los partidos
- Tablero de posiciones por grupo
- Actualizaciones en vivo mediante SignalR

## ⚙️ Configuración y variables de entorno

El servicio `api` usa variables de entorno definidas en `docker-compose.yml` y espera estas claves:

- `FOOTBALL_API_KEY`: API key de API-Football
- `JWT_SECRET`: clave secreta para JWT

Dentro del contenedor, la app también usa:

- `ConnectionStrings__Default=Host=postgres;Database=worldcup;Username=admin;Password=secret`
- `FootballApi__BaseUrl=https://v3.football.api-sports.io/`
- `FootballApi__LeagueId=1`
- `FootballApi__Season=2026`
- `Jwt__ExpirationHours=24`
- `Redis__ConnectionString=redis:6379`

> En producción, sustituye las variables sensibles por valores seguros.

## 🛠️ Ejecutar localmente con Docker

Desde la raíz del repositorio:

```bash
docker compose up --build
```

Esto levanta:

- `postgres` en `localhost:5432`
- `redis` en `localhost:6379`
- `api` en `http://localhost:5001`
- `frontend` en `http://localhost:4200`

## 🧪 Desarrollo local sin Docker

### Backend

1. Abrir `backend` en Visual Studio o VS Code.
2. Configurar las variables de entorno necesarias.
3. Ejecutar la solución `WorldCup.slnx`.
4. La API inicializa migraciones y ejecuta seed de datos de ejemplo.

### Frontend

```bash
cd frontend
npm install
npm start
```

Luego acceder a `http://localhost:4200`.

## 🧾 Endpoints clave

La API tiene controladores principales en `backend/src/WorldCup.API/Controllers`:

- `MatchesController` - partidos, fixture y resultados
- `PredictionsController` - crear/ver predicciones
- `GroupsController` - crear/unirse a grupos y ver leaderboard
- `AuthController` - login, registro y token JWT
- `AdminController` / `ConfigController` - configuración y tareas administrativas

Y el hub de SignalR:

- `/hubs/match`

## 📌 Rutas principales de la app

- `/` — Página principal y partidos del día
- `/mundial` — Fixture completo del Mundial
- `/mundial/grupos` — Tablas de grupos del Mundial
- `/grupos` — Mis grupos de predicciones
- `/grupos/:id` — Detalle de grupo y leaderboard
- `/predicciones` — Mis predicciones
- `/auth/login` — Login
- `/auth/registro` — Registro

## 🧵 Dependencias principales

### Backend
- MediatR
- EF Core
- ASP.NET Core Authentication/JWT
- SignalR

### Frontend
- `@angular/common`, `@angular/core`, `@angular/router`
- `@microsoft/signalr`
- `rxjs`

## 📌 Notas adicionales

- El backend aplica migraciones automáticamente en `Program.cs`.
- Durante la inicialización, se ejecuta un seeder de datos mock para facilitar pruebas.
- La comunicación SignalR admite token JWT desde la query string cuando el cliente se conecta al hub.

## 🧭 Recomendaciones

- Mantén el `Jwt__Secret` y la clave `FOOTBALL_API_KEY` fuera del repositorio.
- Usa Docker Compose para tener la misma configuración de entorno en desarrollo.


