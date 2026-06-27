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
      className={cn("overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm", className)}
    >
      <AccordionItem value="content" className="border-b-0">
        <AccordionTrigger
          className={cn(
            "bg-neutral-100 px-3 py-3 hover:no-underline md:px-4",
            headingClassName === "compact" && "py-2.5"
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2 pr-3">
            <span className="material-symbols-outlined text-[18px] text-emerald-600" aria-hidden="true">
              {icon}
            </span>
            <span className="truncate text-sm font-medium normal-case text-neutral-800">
              {title}
            </span>
          </span>
          <span className="mr-2 max-w-[42%] shrink text-right text-[0.68rem] font-medium leading-tight text-neutral-500 sm:max-w-none">
            {meta}
          </span>
        </AccordionTrigger>
        <AccordionContent className="border-t border-neutral-100 px-3 py-3 md:px-4">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
