"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import OwnerAvatar from "@/components/OwnerAvatar";
import OwnerProfilePanel from "@/components/OwnerProfilePanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
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

  // Sync the selection from the URL only on real route changes. We deliberately
  // do NOT depend on `owners`: LiveRefresher re-fetches the owners list every
  // 30s, and reacting to that new array reference would snap the user's
  // selection back to the top owner. Selection is held by owner name and
  // re-resolved on every render, so it survives list refreshes regardless.
  useEffect(() => {
    if (!owners.length) {
      return;
    }
    if (pathname === "/owners") {
      window.history.replaceState(null, "", ownerPath(owners[0].owner));
      setActiveOwner(owners[0].owner);
    } else {
      setActiveOwner(ownerFromPath(pathname, owners));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

  return (
    <Tabs value={selectedOwner.owner} onValueChange={selectOwner} className="grid gap-4">
      <TabsList
        variant="line"
        className="flex w-full gap-2 overflow-x-auto border-foreground bg-background p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Select an owner"
      >
        {owners.map((owner, index) => {
          const isActive = owner.owner === selectedOwner.owner;

          return (
            <TabsTrigger
              key={owner.owner}
              value={owner.owner}
              className={cn(
                "flex min-w-[156px] shrink-0 items-center gap-2 px-2.5 py-2 text-left",
                isActive
                  ? "border-foreground bg-accent text-accent-foreground"
                  : "border-foreground bg-background hover:bg-secondary"
              )}
            >
              <OwnerAvatar owner={owner.owner} className="h-9 w-9 border-2 border-foreground" />
              <span className="grid gap-0.5">
                <strong className="font-display text-sm font-black tracking-[-0.04em] text-current">{owner.owner}</strong>
                <span className="font-mono text-[0.56rem] font-bold uppercase tracking-[0.14em] text-current/75">#{index + 1}</span>
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value={selectedOwner.owner} className="min-w-0">
        <OwnerProfilePanel owner={selectedOwner} rank={selectedIndex + 1} />
      </TabsContent>
    </Tabs>
  );
}
