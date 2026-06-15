"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Periodically re-fetches the server components on the current route so live
 * scores, statuses and standings update without a manual reload. router.refresh()
 * re-runs the server-side data fetches while preserving client component state
 * (e.g. the selected owner tab).
 *
 * Refreshes are skipped while the tab is hidden and fired immediately when it
 * becomes visible again, so a backgrounded tab doesn't hammer the API.
 */
export default function LiveRefresher({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    const id = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, intervalMs]);

  return null;
}
