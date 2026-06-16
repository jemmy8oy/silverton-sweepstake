import hmac
import logging
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from requests import RequestException

from services.cache import clear_cache, get_cached, set_cached
from services.data_loader import build_team_lookup, load_draw
from services.football_api import get_fixtures as provider_get_fixtures
from services.football_api import refresh_all
from services.scheduler import start_scheduler
from services.sweepstake import (
    build_leaderboards,
    build_owner_summaries,
    build_underdog_tracker,
    enrich_fixtures,
    get_owner_detail,
    live_fixtures,
    next_owner_vs_owner,
    today_fixtures,
)

BASE_PAYLOAD_TTL_SECONDS = int(os.environ.get("BASE_PAYLOAD_TTL_SECONDS", "30"))
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN")

app = Flask(__name__)
CORS(app)
_scheduler_bootstrapped = False


def _build_base_payload():
    draw = load_draw()
    fixtures = provider_get_fixtures()
    team_lookup = build_team_lookup(draw)
    enriched = enrich_fixtures(fixtures, team_lookup)
    return {"draw": draw, "fixtures": fixtures, "enriched": enriched}


def _base_payload():
    # The cached payload is already fully hydrated/enriched, so a cache hit
    # returns it directly. Crucially we do NOT re-set the cache on a hit — doing
    # so previously extended the TTL on every request, so under steady traffic
    # the cache never expired and freshly polled fixtures never surfaced.
    cached = get_cached("base_payload")
    if cached is not None:
        return cached

    payload = _build_base_payload()
    set_cached("base_payload", payload, ttl_seconds=BASE_PAYLOAD_TTL_SECONDS)
    return payload


def _json_error(message: str, status: int = 500):
    return jsonify({"error": message}), status


@app.before_request
def ensure_scheduler_started():
    global _scheduler_bootstrapped
    if _scheduler_bootstrapped:
        return None

    # Avoid starting the poller as an import side effect. Under the Flask debug
    # reloader that can leave an old parent process polling with stale code and
    # overwriting fixtures.json after source changes.
    start_scheduler()
    _scheduler_bootstrapped = True
    return None


@app.errorhandler(RuntimeError)
def handle_runtime_error(error):
    return _json_error(str(error), 500)


@app.errorhandler(RequestException)
def handle_upstream_error(error):
    return _json_error(f"Upstream data provider unavailable: {error}", 502)


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "service": "sweepstake-dashboard"})


@app.get("/api/draw")
def draw():
    return jsonify(_base_payload()["draw"])


@app.get("/api/owners")
def owners():
    payload = _base_payload()
    return jsonify(build_owner_summaries(payload["draw"], payload["fixtures"], payload["enriched"]))


@app.get("/api/owners/<owner>")
def owner_detail(owner: str):
    payload = _base_payload()
    summaries = build_owner_summaries(payload["draw"], payload["fixtures"], payload["enriched"])
    owner_payload = get_owner_detail(owner, summaries)
    if not owner_payload:
        return _json_error(f"Owner not found: {owner}", 404)
    return jsonify(owner_payload)


@app.get("/api/fixtures")
def fixtures():
    return jsonify(_base_payload()["enriched"])


@app.get("/api/fixtures/today")
def fixtures_today():
    return jsonify(today_fixtures(_base_payload()["enriched"]))


@app.get("/api/fixtures/live")
def fixtures_live():
    return jsonify(live_fixtures(_base_payload()["enriched"]))


@app.get("/api/leaderboards")
def leaderboards():
    payload = _base_payload()
    return jsonify(build_leaderboards(payload["draw"], payload["fixtures"], payload["enriched"]))


@app.get("/api/underdog")
def underdog():
    payload = _base_payload()
    return jsonify(build_underdog_tracker(payload["draw"], payload["fixtures"]))


@app.get("/api/matchups/next")
def next_matchups():
    return jsonify(next_owner_vs_owner(_base_payload()["enriched"]))


def _admin_authorised() -> bool:
    # When ADMIN_TOKEN is configured, require a matching bearer/header token.
    # When it is not configured, only allow the call in debug (local dev) so a
    # deployed instance can't be hammered with unauthenticated refreshes.
    if not ADMIN_TOKEN:
        return app.debug
    provided = request.headers.get("X-Admin-Token") or ""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        provided = provided or auth[len("Bearer "):]
    return bool(provided) and hmac.compare_digest(provided, ADMIN_TOKEN)


@app.post("/api/admin/refresh")
def admin_refresh():
    if not _admin_authorised():
        return _json_error("Unauthorised: admin token required", 401)
    clear_cache()
    result = refresh_all()
    return jsonify({"ok": True, "refresh": result})


if not ADMIN_TOKEN and not app.debug:
    logging.getLogger(__name__).warning(
        "ADMIN_TOKEN is not set; /api/admin/refresh is disabled (returns 401). "
        "Set ADMIN_TOKEN to enable manual refresh in production."
    )


if __name__ == "__main__":
    app.run(debug=True, port=5001)
