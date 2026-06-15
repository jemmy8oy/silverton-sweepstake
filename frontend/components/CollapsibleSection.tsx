"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type CollapsibleSectionProps = {
  title: string;
  icon: string;
  meta?: ReactNode;
  children: ReactNode;
  /** Collapse by default on small screens; stays open on desktop. */
  collapseOnMobile?: boolean;
  /** Default open state on first render / desktop. */
  defaultOpen?: boolean;
  className?: string;
  headingClassName?: string;
};

/**
 * Accordion section used in the owner profile. On phones the heavy sections
 * (teams, journey, head-to-heads) collapse so a single owner isn't an endless
 * scroll, while on desktop everything stays expanded.
 */
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
  const bodyId = useId();

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
    <section className={className ? `collapsible ${className}` : "collapsible"}>
      <button
        type="button"
        className={headingClassName ? `collapsible-summary ${headingClassName}` : "collapsible-summary"}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="collapsible-title">
          <span className="material-symbols-outlined" aria-hidden="true">
            {icon}
          </span>
          <h3>{title}</h3>
        </span>
        <span className="collapsible-meta">
          {meta}
          <span className={open ? "material-symbols-outlined collapsible-chevron open" : "material-symbols-outlined collapsible-chevron"} aria-hidden="true">
            expand_more
          </span>
        </span>
      </button>
      <div id={bodyId} className="collapsible-body" hidden={!open}>
        {children}
      </div>
    </section>
  );
}
