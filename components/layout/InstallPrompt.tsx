"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn, focusRing } from "@/lib/cn";

/* CLAUDE.md section 12: "PWA install prompt appears on second visit."
 *
 * Chrome and Android fire `beforeinstallprompt` on their own schedule, which
 * does not line up with "second visit" — it is based on engagement signals
 * the browser keeps to itself. This intercepts that event, holds onto it,
 * and shows this product's own banner at the point the spec actually asks
 * for, calling the browser's real prompt only once someone taps Install.
 *
 * Honest limit: Safari on iOS never fires `beforeinstallprompt` at all.
 * Installing there is the manual Share sheet → Add to Home Screen flow, and
 * nothing in a page can trigger or detect it. This banner simply does not
 * appear on iOS, rather than showing instructions for a button that would
 * do nothing.
 */

const VISIT_KEY = "suhail-visits";
const DISMISSED_KEY = "suhail-install-dismissed";
const SESSION_COUNTED_KEY = "suhail-visit-counted";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    /* iOS's own flag for an already-installed home-screen app */
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    /* once per browser session, so navigating between routes does not
       inflate the count the way a per-render effect would */
    if (!sessionStorage.getItem(SESSION_COUNTED_KEY)) {
      const count = Number(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
      localStorage.setItem(VISIT_KEY, String(count));
      sessionStorage.setItem(SESSION_COUNTED_KEY, "1");
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
      const visits = Number(localStorage.getItem(VISIT_KEY) ?? "0");
      if (visits >= 2) setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setVisible(false);
    if (outcome === "accepted") setDeferred(null);
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Suhail"
      className={cn(
        "fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[60]",
        "mx-auto flex max-w-[420px] items-center gap-3 border-2 border-text bg-bg p-4",
        "shadow-lg md:inset-x-auto md:right-6 md:bottom-6",
      )}
    >
      <BrandMark size={28} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-[13px] font-extrabold text-text">Install Suhail</p>
        <p className="text-[12px] text-text/65">Tonight&rsquo;s sky, one tap from your home screen.</p>
      </div>
      <button
        type="button"
        onClick={install}
        className={cn(
          "shrink-0 bg-accent px-3.5 py-2 font-display text-[11px] font-extrabold uppercase tracking-[0.08em] text-text",
          "transition-colors duration-150 ease-move hover:bg-accent-600",
          focusRing,
        )}
      >
        Install
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className={cn("shrink-0 p-1 text-text/50 hover:text-text", focusRing)}
      >
        <X aria-hidden size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
