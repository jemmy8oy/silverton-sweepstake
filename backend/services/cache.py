import json
import os
import tempfile
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
    atomic_write_text(_cache_path(key), json.dumps(payload, indent=2))


def atomic_write_text(path: Path, contents: str) -> None:
    # Write to a temp file in the same directory, then atomically replace the
    # target so concurrent readers never observe a half-written JSON document.
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(contents)
        os.replace(tmp_name, path)
    except BaseException:
        Path(tmp_name).unlink(missing_ok=True)
        raise


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
