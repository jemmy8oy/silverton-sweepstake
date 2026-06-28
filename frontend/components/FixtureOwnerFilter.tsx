"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import type { OwnerSummary } from "@/lib/types";

type FixtureOwnerFilterProps = {
  activeDate: string;
  activeOwner: string;
  owners: OwnerSummary[];
  className?: string;
};

export default function FixtureOwnerFilter({ activeDate, activeOwner, owners, className }: FixtureOwnerFilterProps) {
  const router = useRouter();

  function handleOwnerChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextOwner = event.target.value;
    const params = new URLSearchParams();
    params.set("date", activeDate);
    if (nextOwner) {
      params.set("owner", nextOwner);
    }
    router.push(`/fixtures?${params.toString()}`);
  }

  return (
    <select
      value={activeOwner}
      onChange={handleOwnerChange}
      aria-label="Filter fixtures by owner"
      className={className}
    >
      <option value="">Owner</option>
      {owners.map((owner) => (
        <option key={owner.owner} value={owner.owner}>
          {owner.owner}
        </option>
      ))}
    </select>
  );
}
