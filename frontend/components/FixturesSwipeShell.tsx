"use client";

import type { ReactNode, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

type FixturesSwipeShellProps = {
  children: ReactNode;
  nextHref: string;
  previousHref: string;
  canGoNext: boolean;
  canGoPrevious: boolean;
};

type TouchPoint = {
  x: number;
  y: number;
};

const SWIPE_THRESHOLD = 48;

export default function FixturesSwipeShell({
  children,
  nextHref,
  previousHref,
  canGoNext,
  canGoPrevious
}: FixturesSwipeShellProps) {
  const router = useRouter();
  const touchStart = useRef<TouchPoint | null>(null);

  function onTouchStart(event: TouchEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest(".fixtures-date-scroll")) {
      touchStart.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    if (!touchStart.current) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0 && canGoNext) {
      router.push(nextHref);
      return;
    }

    if (deltaX > 0 && canGoPrevious) {
      router.push(previousHref);
    }
  }

  return (
    <main
      className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1280px] gap-6 px-4 py-4 pb-28 md:min-h-screen md:px-6 md:py-8 md:pb-10 xl:px-8"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {children}
    </main>
  );
}
