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
  description,
  actions,
  className,
  contentClassName
}: SectionShellProps) {
  return (
    <section className={cn("brutal-surface", className)}>
      {title || marker || description || actions ? (
        <header className="grid gap-3 border-b-2 border-foreground px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:px-6">
          <div className="grid gap-2">
            {marker ? <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">{marker}</span> : null}
            {title ? <h2 className="text-3xl font-black leading-none md:text-4xl">{title}</h2> : null}
            {description ? <div className="text-sm leading-7 text-muted-foreground">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-5 py-5 md:px-6", contentClassName)}>{children}</div>
    </section>
  );
}
