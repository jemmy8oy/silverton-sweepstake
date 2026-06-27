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
    <section className={cn("grid gap-3 rounded-2xl border border-neutral-100 bg-white px-4 py-4", className)}>
      {eyebrow ? <span className="text-xs font-medium text-muted-foreground">{eyebrow}</span> : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">{title}</h1>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
