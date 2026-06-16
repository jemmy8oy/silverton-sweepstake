import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <section className={cn("brutal-surface grid gap-4 px-5 py-6 md:px-8 md:py-7", className)}>
      {eyebrow ? <span className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</span> : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-3">
          <h1 className="text-5xl font-black leading-none md:text-7xl">{title}</h1>
          {description ? <div className="max-w-[60ch] text-sm leading-7 text-muted-foreground">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
