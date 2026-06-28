"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

type FixtureDatePickerProps = {
  activeDate: string;
  activeOwner: string;
  className?: string;
};

export default function FixtureDatePicker({ activeDate, activeOwner, className }: FixtureDatePickerProps) {
  const router = useRouter();

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    const nextDate = event.target.value;
    if (!nextDate) {
      return;
    }

    const params = new URLSearchParams();
    params.set("date", nextDate);
    if (activeOwner) {
      params.set("owner", activeOwner);
    }
    router.push(`/fixtures?${params.toString()}`);
  }

  return (
    <input
      id="fixture-date-picker"
      aria-label="Pick a date"
      type="date"
      value={activeDate}
      onChange={handleDateChange}
      className={className}
    />
  );
}
