"""Background ESPN poller.

The dashboard is driven by a persisted fixtures file that is hydrated from
ESPN. Without a scheduler that file only changes when someone manually hits
``POST /api/admin/refresh``, so scores go stale. This module runs a daemon
thread that refreshes the file on an interval and invalidates the API cache.

Gunicorn runs multiple workers and each imports ``app:app``, so a naive
scheduler would poll ESPN once per worker. We take an exclusive file lock and
only the worker that wins it runs the poller; the rest stand down. If that
worker dies the OS releases the lock and another worker can take over on its
next start.
"""

import atexit
import logging
import os
import threading
from pathlib import Path

from .cache import clear_cache
from .football_api import refresh_all

log = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = int(os.environ.get("ESPN_POLL_INTERVAL_SECONDS", "90"))
_LOCK_PATH = Path(__file__).resolve().parents[1] / "cache" / ".scheduler.lock"

_stop_event = threading.Event()
_started = False
# Module-level references keep the thread and lock file alive for the process
# lifetime (a garbage-collected lock handle would release the lock).
_thread: threading.Thread | None = None
_lock_handle = None


def _polling_enabled() -> bool:
    return os.environ.get("ENABLE_ESPN_POLLING", "1").lower() in ("1", "true", "yes", "on")


def _acquire_single_instance_lock() -> bool:
    """Return True if this process should own the poller.

    Uses ``fcntl.flock`` where available (POSIX). On platforms without it we
    fall back to allowing the poller to run.
    """
    global _lock_handle
    try:
        import fcntl
    except ImportError:
        return True

    _LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    handle = open(_LOCK_PATH, "w", encoding="utf-8")
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.close()
        return False

    handle.seek(0)
    handle.truncate()
    handle.write(str(os.getpid()))
    handle.flush()

    _lock_handle = handle
    return True


def refresh_once() -> None:
    try:
        result = refresh_all()
        clear_cache("base_payload")
        log.info("ESPN refresh ok: %s fixtures persisted", result.get("fixtures"))
    except Exception:  # noqa: BLE001 - keep last-known-good data on any failure
        log.exception("ESPN refresh failed; keeping previously cached fixtures")


def _loop() -> None:
    while not _stop_event.is_set():
        refresh_once()
        _stop_event.wait(POLL_INTERVAL_SECONDS)


def start_scheduler() -> bool:
    """Start the background poller. Returns True if it started in this process."""
    global _started, _thread

    if _started:
        return False
    if not _polling_enabled():
        log.info("ESPN polling disabled via ENABLE_ESPN_POLLING")
        return False
    if not _acquire_single_instance_lock():
        log.info("Another worker owns the ESPN poller (pid %s standing down)", os.getpid())
        return False

    _started = True
    _thread = threading.Thread(target=_loop, name="espn-poller", daemon=True)
    _thread.start()
    atexit.register(stop_scheduler)
    log.info("ESPN poller started (pid %s, every %ss)", os.getpid(), POLL_INTERVAL_SECONDS)
    return True


def stop_scheduler() -> None:
    _stop_event.set()
