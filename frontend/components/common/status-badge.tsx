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
        "min-h-5 px-1.5 py-0 text-[0.58rem]",
        tone === "default" && "border-neutral-200 bg-neutral-100 text-neutral-700",
        tone === "accent" && "border-emerald-500 bg-emerald-500 text-white",
        tone === "destructive" && "border-red-500 bg-red-500 text-white",
        tone === "blue" && "border-blue-500 bg-blue-500 text-white",
        tone === "muted" && "border-neutral-200 bg-neutral-100 text-neutral-500",
        className
      )}
    >
      {children}
    </Badge>
  );
}
