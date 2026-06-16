import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-4 pb-28 md:px-6 md:py-8 md:pb-10 xl:px-8", className)}>{children}</main>;
}
