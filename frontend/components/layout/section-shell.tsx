import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  children: ReactNode;
  title?: string;
  marker?: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function SectionShell({
  children,
  title,
  marker,
  description: _description,
  actions,
  className,
  contentClassName
}: SectionShellProps) {
  return (
    <section className={cn("brutal-surface", className)}>
      {title || marker || actions ? (
        <header className="grid gap-2 border-b border-neutral-100 bg-neutral-100 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-2">
            {marker ? <span className="text-xs font-medium text-neutral-500">{marker}</span> : null}
            {title ? <h2 className="truncate text-sm font-medium leading-5 text-neutral-800">{title}</h2> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 py-4", contentClassName)}>{children}</div>
    </section>
  );
}
