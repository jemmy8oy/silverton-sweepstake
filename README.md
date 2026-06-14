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
- `GET /api/punishments`
- `POST /api/admin/refresh`

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

`GET /api/fixtures/today` caches ESPN's daily scoreboard for 300 seconds in `backend/cache`. If ESPN is unavailable, the backend falls back to local JSON fixtures so the app still renders during development.

Country names and three-letter abbreviations are canonicalized through `backend/data/countries.json`. ESPN `team.abbreviation` is used during fixture hydration, and the country reference keeps draw/team names aligned with what the frontend renders.

To switch providers later, keep returning the normalized fixture shape from `football_api.py` and the existing sweepstake enrichment will continue to work.
