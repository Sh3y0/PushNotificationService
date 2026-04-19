# Push notification API

TypeScript Node.js (Express) service that stores web push subscriptions in PostgreSQL and sends notifications through the OneSignal REST API.

Source lives under `src/` and compiles to `dist/` for production runs.

## Prerequisites

- Node.js 20 or newer
- PostgreSQL 13 or newer (running locally or on your network)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a database user and ensure PostgreSQL accepts connections from this app (host, port, credentials).

3. Copy the environment template and edit values:

   ```bash
   cp .env.example .env
   ```

4. Fill in `.env`:

   | Variable | Description |
   |----------|-------------|
   | `PORT` | HTTP port (default `3000`) |
   | `ONESIGNAL_APP_ID` | OneSignal app ID |
   | `ONESIGNAL_API_KEY` | OneSignal REST API key |
   | `DB_HOST` | PostgreSQL host |
   | `DB_PORT` | PostgreSQL port |
   | `DB_USER` | Database user |
   | `DB_PASSWORD` | Database password (can be empty for local trust auth) |
   | `DB_NAME` | Database name (created automatically on first run if missing) |

   On first startup the service connects to the `postgres` database to create `DB_NAME` when it does not exist, then creates the `subscriptions` and `notifications_log` tables if needed.

5. Start the server in development (TypeScript via `tsx` with watch):

   ```bash
   npm run dev
   ```

6. Production: compile then run the emitted JavaScript:

   ```bash
   npm run build
   npm start
   ```

The API listens on `http://localhost:${PORT}` (for example `http://localhost:3000`).

## API documentation (Swagger UI)

With the server running, open interactive docs in the browser:

`http://localhost:3000/api-docs`

That page is generated from `../docs/api-contract.openapi.yaml`. If the file cannot be read (for example wrong working directory), `/api-docs` is not registered and a warning is logged at startup.

## Endpoints (summary)

- `GET /health` — Liveness and database connectivity
- `POST /subscribe` — Register or update a subscription (`playerId`, optional `segment`)
- `POST /unsubscribe` — Mark a subscription as inactive
- `GET /status/:playerId` — Read stored subscription state
- `GET /subscribers` — List all subscription rows (`playerId`, `segment`, `isSubscribed`, timestamps); requires header `x-api-key`
- `POST /send` — Send a notification (requires header `x-api-key` matching `API_KEY` in `.env`)

The full contract is described in `../docs/api-contract.openapi.yaml` at the repository root.

## Security notes

- Keep `API_KEY` and `ONESIGNAL_API_KEY` secret; never commit `.env`.
- External callers (for example a .NET backend) should call `POST /send` with `x-api-key` set server-side only.
