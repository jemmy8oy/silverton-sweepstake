import LoadingState from "@/components/common/loading-state";
import PageHeader from "@/components/layout/page-header";
import PageShell from "@/components/layout/page-shell";

export default function Loading() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Loading"
        title="Refreshing Data"
        description="The latest fixtures, owners, and standings are being loaded."
      />
      <LoadingState rows={5} />
    </PageShell>
  );
}
