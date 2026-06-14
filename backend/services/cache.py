import json
import time
from pathlib import Path
from typing import Any, Callable

CACHE_DIR = Path(__file__).resolve().parents[1] / "cache"


def _cache_path(key: str) -> Path:
    safe_key = "".join(char if char.isalnum() or char in ("-", "_") else "_" for char in key)
    return CACHE_DIR / f"{safe_key}.json"


def get_cached(key: str) -> Any | None:
    path = _cache_path(key)
    if not path.exists():
        return None

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None

    if payload.get("expires_at", 0) < time.time():
        path.unlink(missing_ok=True)
        return None

    return payload.get("data")


def set_cached(key: str, data: Any, ttl_seconds: int) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    payload = {"expires_at": time.time() + ttl_seconds, "data": data}
    _cache_path(key).write_text(json.dumps(payload, indent=2), encoding="utf-8")


def cached_or_fetch(key: str, ttl_seconds: int, fetch_fn: Callable[[], Any]) -> Any:
    cached = get_cached(key)
    if cached is not None:
        return cached

    data = fetch_fn()
    set_cached(key, data, ttl_seconds)
    return data


def clear_cache(key: str | None = None) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    if key:
        _cache_path(key).unlink(missing_ok=True)
        return

    for path in CACHE_DIR.glob("*.json"):
        path.unlink(missing_ok=True)
