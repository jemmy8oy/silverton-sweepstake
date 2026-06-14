"use client";

import { useEffect, useState } from "react";
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
  const selectedOwner = owners[Math.max(activeIndex, 0)] ?? null;

  if (!selectedOwner) {
    return null;
  }

  return (
    <div className="owners-tabbed-view">
      <div className="owners-tabs" role="tablist" aria-label="Owner tabs">
        {owners.map((owner, index) => {
          const isActive = owner.owner === selectedOwner.owner;

          return (
            <button
              key={owner.owner}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? "owner-tab active" : "owner-tab"}
              onClick={() => {
                setActiveOwner(owner.owner);
                window.history.pushState(null, "", ownerPath(owner.owner));
              }}
            >
              <OwnerAvatar owner={owner.owner} className="owner-tab-avatar" />
              <span className="owner-tab-copy">
                <strong>{owner.owner}</strong>
                <span>
                  #{index + 1} • {owner.points} pts • {owner.teamsStillAlive}/{owner.teamCount} alive
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="owner-tab-panel">
        <OwnerProfilePanel owner={selectedOwner} rank={Math.max(activeIndex, 0) + 1} />
      </div>
    </div>
  );
}
