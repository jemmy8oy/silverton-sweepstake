import Link from "next/link";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";

export default function OfflinePage() {
  return (
    <PageShell className="min-h-[calc(100vh-4rem)] place-items-center md:min-h-screen">
      <section className="w-full max-w-[720px]">
        <PageHeader
          eyebrow="Offline"
          title="You’re Offline"
          description="The latest live data needs a connection, but the app shell is still available. Reconnect to refresh fixtures, leaderboards, and owner standings."
          actions={
            <Button asChild variant="accent">
              <Link href="/">Retry Home</Link>
            </Button>
          }
        />
      </section>
    </PageShell>
  );
}
