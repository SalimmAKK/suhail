"use client";

import { useEffect } from "react";

/* Registers public/sw.js. A client component in the layout rather than
 * anything in next.config.ts — service worker registration is a runtime
 * browser API call, not a build step, and next.config.ts only runs at build
 * and server-start time.
 *
 * Production only. A service worker in dev intercepts fetches from a cache
 * that yesterday's code wrote, which is a confusing thing to debug against
 * while iterating — the standard reason every PWA setup gates this the same
 * way.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
