import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("brutal-surface flex flex-col gap-3 px-5 py-4 md:flex-row md:items-end md:justify-between md:px-6", className)}>
      {children}
    </div>
  );
}
