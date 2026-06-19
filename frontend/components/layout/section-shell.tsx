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
        <header className="grid gap-2 border-b-2 border-foreground px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-5">
          <div className="grid gap-1">
            {marker ? <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{marker}</span> : null}
            {title ? <h2 className="text-2xl font-black leading-none md:text-3xl">{title}</h2> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 py-4 md:px-5", contentClassName)}>{children}</div>
    </section>
  );
}
