from flask import Flask, jsonify
from flask_cors import CORS

from services.cache import clear_cache, get_cached, set_cached
from services.data_loader import build_team_lookup, hydrate_draw, hydrate_fixture_teams, load_draw
from services.football_api import get_fixtures as provider_get_fixtures
from services.football_api import refresh_all
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

app = Flask(__name__)
CORS(app)


def _base_payload():
    cached = get_cached("base_payload")
    if cached:
        draw = hydrate_draw(cached.get("draw", {}))
        fixtures = [hydrate_fixture_teams(fixture) for fixture in cached.get("fixtures", [])]
        team_lookup = build_team_lookup(draw)
        enriched = enrich_fixtures(fixtures, team_lookup)
        payload = {"draw": draw, "fixtures": fixtures, "enriched": enriched}
        set_cached("base_payload", payload, ttl_seconds=60)
        return payload

    draw = load_draw()
    fixtures = provider_get_fixtures()
    team_lookup = build_team_lookup(draw)
    enriched = enrich_fixtures(fixtures, team_lookup)
    payload = {"draw": draw, "fixtures": fixtures, "enriched": enriched}
    set_cached("base_payload", payload, ttl_seconds=60)
    return payload


def _json_error(message: str, status: int = 500):
    return jsonify({"error": message}), status


@app.errorhandler(RuntimeError)
def handle_runtime_error(error):
    return _json_error(str(error), 500)


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


@app.post("/api/admin/refresh")
def admin_refresh():
    clear_cache()
    result = refresh_all()
    return jsonify({"ok": True, "refresh": result})


if __name__ == "__main__":
    app.run(debug=True, port=5001)
