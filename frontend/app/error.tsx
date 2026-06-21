"use client";

import { useEffect } from "react";
import ErrorState from "@/components/common/error-state";
import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Error"
        title="UI Recovery"
        description="A route-level error interrupted the current view. Try reloading the route."
      />
      <ErrorState
        description={error.message || "An unexpected error occurred while rendering this page."}
        action={
          <Button type="button" variant="accent" onClick={reset}>
            Retry
          </Button>
        }
      />
    </PageShell>
  );
}
