"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type CollapsibleSectionProps = {
  title: string;
  icon: string;
  meta?: ReactNode;
  children: ReactNode;
  collapseOnMobile?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headingClassName?: string;
};

export default function CollapsibleSection({
  title,
  icon,
  meta,
  children,
  collapseOnMobile = false,
  defaultOpen = true,
  className,
  headingClassName
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!collapseOnMobile) {
      return;
    }
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => setOpen(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [collapseOnMobile]);

  return (
    <Accordion
      type="single"
      collapsible
      value={open ? "content" : undefined}
      onValueChange={(value) => setOpen(value === "content")}
      className={cn("brutal-surface", className)}
    >
      <AccordionItem value="content" className="border-b-0">
        <AccordionTrigger
          className={cn(
            "px-5 py-4 hover:no-underline md:px-6",
            headingClassName === "compact" && "py-3.5"
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-[color:var(--color-signal-blue)]" aria-hidden="true">
              {icon}
            </span>
            <span className="font-display text-3xl font-black normal-case tracking-[-0.04em] text-foreground md:text-4xl">
              {title}
            </span>
          </span>
          <span className="mr-3 flex items-center gap-3 font-mono text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {meta}
          </span>
        </AccordionTrigger>
        <AccordionContent className="border-t-2 border-foreground px-5 py-5 md:px-6">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
