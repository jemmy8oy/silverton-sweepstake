import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto grid w-full max-w-[1280px] gap-4 px-3 py-3 pb-24 md:px-4 md:py-4 md:pb-8 xl:px-5", className)}>{children}</main>;
}
