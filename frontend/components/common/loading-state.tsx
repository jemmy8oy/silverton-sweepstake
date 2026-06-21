import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function LoadingState({ className, rows = 3 }: { className?: string; rows?: number }) {
  return (
    <div className={cn("brutal-surface grid gap-4 px-5 py-5", className)}>
      <Skeleton className="h-4 w-28 bg-foreground/10" />
      <Skeleton className="h-12 w-2/3 bg-foreground/10" />
      <div className="grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full bg-foreground/10" />
        ))}
      </div>
    </div>
  );
}
