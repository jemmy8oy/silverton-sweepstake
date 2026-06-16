import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "default" | "accent" | "destructive" | "blue" | "muted";

export default function StatusBadge({
  children,
  tone = "default",
  className
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        tone === "default" && "bg-primary text-primary-foreground",
        tone === "accent" && "bg-accent text-accent-foreground",
        tone === "destructive" && "bg-destructive text-destructive-foreground",
        tone === "blue" && "bg-[color:var(--color-signal-blue)] text-white",
        tone === "muted" && "bg-secondary text-secondary-foreground",
        className
      )}
    >
      {children}
    </Badge>
  );
}
