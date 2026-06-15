# World Cup Sweepstake Dashboard

A lightweight MVP scaffold for a group World Cup sweepstake dashboard.

The app uses:

- Frontend: Next.js, React, TypeScript
- Backend: Flask
- Persistence: static JSON files in `backend/data`
- Cache: file-based JSON cache in `backend/cache`
- External football API: ESPN's public football scoreboard API in `backend/services/football_api.py`

No Postgres, Redis, Celery, auth, or external API key is required.

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask --app app run --debug --port 5001
```

The Flask API runs on `http://localhost:5001`.

Available routes:

- `GET /api/health`
- `GET /api/draw`
- `GET /api/owners`
- `GET /api/owners/<owner>`
- `GET /api/fixtures`
- `GET /api/fixtures/today`
- `GET /api/fixtures/live`
- `GET /api/leaderboards`
- `GET /api/underdog`
- `GET /api/matchups/next`
- `POST /api/admin/refresh` (requires the `ADMIN_TOKEN` — see below)

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The Next.js app runs on `http://localhost:3000`.

Create a local env file if needed:

```bash
cp .env.example .env.local
```

Default API URL:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

## Mock Data

The draw, country reference, and fallback fixtures live in:

- `backend/data/draw.json`
- `backend/data/countries.json`
- `backend/data/fixtures.json`

Fixtures are enriched by the backend with owner, pot, matchup, and readable kickoff fields. The frontend should not calculate ownership itself.

## ESPN Hydration

`backend/services/football_api.py` fetches from:

```text
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world
```

A background poller (`backend/services/scheduler.py`) refreshes the tournament
fixtures from ESPN on an interval, persists them to `backend/data/fixtures.json`
(atomically), and invalidates the API cache. All read endpoints — including
`/api/fixtures/today` and `/api/fixtures/live` — are served from that
periodically-refreshed data, so live scores update without a manual reload. The
frontend also calls `router.refresh()` on an interval to pull the latest data.
If ESPN is unavailable, the backend keeps the last-known-good fixtures.

The poller runs as a single instance across gunicorn workers (an `fcntl` file
lock arbitrates). Match-summary calls (goals/cards) are fetched concurrently
with a bounded, retrying HTTP session.

### Backend environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENABLE_ESPN_POLLING` | `1` | Set to `0` to disable the background poller (e.g. local dev/tests). |
| `ESPN_POLL_INTERVAL_SECONDS` | `90` | How often to refresh from ESPN. |
| `ESPN_SUMMARY_WORKERS` | `6` | Concurrency for per-fixture summary fetches. |
| `BASE_PAYLOAD_TTL_SECONDS` | `30` | API response cache TTL. |
| `ADMIN_TOKEN` | _unset_ | Token required by `POST /api/admin/refresh` (sent as `X-Admin-Token` or `Authorization: Bearer`). When unset, the endpoint is disabled outside debug. |

> Deployment note: persistence and cache are file-based (per-pod). With multiple
> replicas each pod polls and stores its own copy. Do **not** run gunicorn with
> `--preload` or the poller thread won't survive the worker fork. For shared
> state across replicas, swap the file store for a database/Redis.

Country names and three-letter abbreviations are canonicalized through `backend/data/countries.json`. ESPN `team.abbreviation` is used during fixture hydration, and the country reference keeps draw/team names aligned with what the frontend renders.

To switch providers later, keep returning the normalized fixture shape from `football_api.py` and the existing sweepstake enrichment will continue to work.
