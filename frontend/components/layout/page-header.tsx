import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export default function PageHeader({ eyebrow, title, description: _description, actions, className }: PageHeaderProps) {
  return (
    <section className={cn("brutal-surface grid gap-3 px-4 py-4 md:px-5 md:py-5", className)}>
      {eyebrow ? <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</span> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <h1 className="text-3xl font-black leading-none md:text-5xl">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
