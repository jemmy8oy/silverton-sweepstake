"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, {
          scope: `${BASE_PATH}/`
        });
      } catch (error) {
        console.error("Service worker registration failed", error);
      }
    };

    void register();
  }, []);

  return null;
}
