"use client";

import { useEffect, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import OwnerAvatar from "@/components/OwnerAvatar";
import OwnerProfilePanel from "@/components/OwnerProfilePanel";
import type { OwnerSummary } from "@/lib/types";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function ownerPath(owner: string) {
  return `${BASE_PATH}/owners/${encodeURIComponent(owner)}`;
}

function ownerFromPath(pathname: string, owners: OwnerSummary[]) {
  // Works with both usePathname() (basePath stripped) and window.location.pathname (basePath included).
  const parts = pathname.split("/").filter(Boolean);
  const ownersIdx = parts.indexOf("owners");
  if (ownersIdx === -1 || ownersIdx === parts.length - 1) {
    return owners[0]?.owner ?? "";
  }
  const value = decodeURIComponent(parts.slice(ownersIdx + 1).join("/"));
  return owners.find((o) => o.owner === value)?.owner ?? owners[0]?.owner ?? "";
}

export default function OwnersClientShell({ owners }: { owners: OwnerSummary[] }) {
  const pathname = usePathname();
  const [activeOwner, setActiveOwner] = useState(() => ownerFromPath(pathname, owners));

  useEffect(() => {
    const nextOwner = ownerFromPath(pathname, owners);
    setActiveOwner(nextOwner);
  }, [pathname, owners]);

  useEffect(() => {
    if (!owners.length) {
      return;
    }

    if (pathname === "/owners") {
      const target = ownerPath(owners[0].owner);
      window.history.replaceState(null, "", target);
      setActiveOwner(owners[0].owner);
    }
  }, [pathname, owners]);

  useEffect(() => {
    const onPopState = () => {
      setActiveOwner(ownerFromPath(window.location.pathname, owners));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [owners]);

  const activeIndex = owners.findIndex((owner) => owner.owner === activeOwner);
  const selectedIndex = Math.max(activeIndex, 0);
  const selectedOwner = owners[selectedIndex] ?? null;

  if (!selectedOwner) {
    return null;
  }

  function selectOwner(owner: string) {
    setActiveOwner(owner);
    window.history.pushState(null, "", ownerPath(owner));
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    let next: number | null = null;
    if (event.key === "ArrowRight") {
      next = (selectedIndex + 1) % owners.length;
    } else if (event.key === "ArrowLeft") {
      next = (selectedIndex - 1 + owners.length) % owners.length;
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = owners.length - 1;
    }
    if (next === null) {
      return;
    }
    event.preventDefault();
    selectOwner(owners[next].owner);
    // APG: arrow/Home/End must move focus to the newly selected tab. This also
    // scrolls the pill into view within the horizontal strip on mobile.
    document.getElementById(`owner-tab-${next}`)?.focus();
  }

  return (
    <div className="owners-tabbed-view">
      <div className="owners-tabs" role="tablist" aria-label="Select an owner" onKeyDown={onTabKeyDown}>
        {owners.map((owner, index) => {
          const isActive = owner.owner === selectedOwner.owner;

          return (
            <button
              key={owner.owner}
              type="button"
              role="tab"
              id={`owner-tab-${index}`}
              aria-selected={isActive}
              aria-controls="owner-tab-panel"
              tabIndex={isActive ? 0 : -1}
              className={isActive ? "owner-tab active" : "owner-tab"}
              onClick={() => selectOwner(owner.owner)}
            >
              <OwnerAvatar owner={owner.owner} className="owner-tab-avatar" />
              <span className="owner-tab-copy">
                <strong>{owner.owner}</strong>
                <span className="owner-tab-rank">#{index + 1}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="owner-tab-panel"
        id="owner-tab-panel"
        role="tabpanel"
        aria-labelledby={`owner-tab-${selectedIndex}`}
      >
        <OwnerProfilePanel owner={selectedOwner} rank={selectedIndex + 1} />
      </div>
    </div>
  );
}
