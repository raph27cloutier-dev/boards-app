# Boards — Hyperlocal Happenings for Montréal

Boards is a dark-mode, poster-wall inspired listings platform for Montréal. This repo contains the Express + Prisma backend, demo data, and a lightweight `/status` smoke page that pulls straight from the live API.

## Quick start

```bash
# Install dependencies
npm install
npm run install:backend

# Start the API (runs migrations on boot)
npm start
```

By default the API listens on `http://localhost:3000`.

### Environment variables

Create a `backend/.env` file (or inject environment variables when deploying) with at least:

```
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<database>?schema=public"
JWT_SECRET="replace-with-long-random-string"
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
CORS_ALLOWLIST="https://boards.app,https://studio.boards.app" # optional
```

The recommendation weights can be tuned via:

```
W_VIBE=2
W_DISTANCE=1.5
W_TIME=1.2
W_POPULARITY=1
W_TRUST=0.5
W_EMBED=1
```

If you omit `CLOUDINARY_*` variables the API will still run, but file uploads will respond with `Uploads unavailable`.

### Database setup & seeding

1. Provision a PostgreSQL instance and set `DATABASE_URL`.
2. Run migrations and generate the Prisma client:

   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

3. Seed the Montréal demo data (idempotent – rerunning updates existing records):

   ```bash
   npm run seed --prefix backend
   ```

   This creates the `raph@boards.app` host and 10 curated Montréal events across Plateau, Mile-End, NDG, Griffintown, Old Montréal, Little Italy, Hochelaga, and more.

### Smoke testing endpoints

With the server running locally:

- `GET /healthz` → `{ "ok": true }`
- `GET /api/events` → seeded event feed (supports filters via `when`, `lat/lng`, `vibe`, `search`)
- `POST /api/reco/feed` → ranked recommendations (body example below)
- `POST /api/reco/feedback` → record interactions for the agent
- `GET /status` → static HTML page that fetches `/api/events` and renders poster cards

Example recommendation request:

```http
POST /api/reco/feed
Content-Type: application/json

{
  "userId": "<raph-user-id>",
  "location": { "lat": 45.52, "lng": -73.57 },
  "radiusKm": 8,
  "when": "weekend",
  "max": 8
}
```

### Railway / production notes

- The backend `npm start` script runs `npx prisma migrate deploy && node server.js`, so migrations are automatically applied when Railway restarts the service.
- Set `CORS_ALLOWLIST` to a comma-separated list of trusted origins for mutating requests. `GET` requests remain readable from anywhere (for shareable listings and status embeds).
- Supply the Cloudinary credentials in Railway variables to allow poster uploads from the Boards host dashboard.

### Project layout

```
backend/
  prisma/
    schema.prisma   # Prisma data model with embeddings + interactions
    seed.js         # Montréal seed script
  server.js         # Express API with auth, events, reco endpoints
  status.html       # Smoke page served at GET /status
```

### Recommendation agent overview

Phase A ships a hybrid scoring engine that blends vibe overlap, proximity, urgency, popularity, host trust, and cosine similarity against stored demo embeddings. Feedback events (`view`, `cosign`, `going`, `hide`) update event popularity and nudge host trust scores. All weights are configurable via environment variables, and the design leaves room for replacing the heuristic layer with a trained model in Phase B.

### Contributing

- Keep additions focused on the backend service – no frontend build tooling lives in this repo.
- Add new vibes or neighborhoods by updating the Prisma seed and redeploying.
- Prefer `npm run seed --prefix backend` locally to refresh demo content before demos.
