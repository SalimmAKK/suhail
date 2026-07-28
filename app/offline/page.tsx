import type { Metadata } from "next";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/Button";

/* The service worker's navigation fallback: what renders when a request
 * fails offline and nothing else was cached for it (public/sw.js's
 * networkFirst falls back to this for any navigation, after checking for a
 * cached copy of the exact page first).
 *
 * Self-contained like not-found.tsx and error.tsx, for the same reason: it
 * has to render regardless of which layout the failed request belonged to,
 * so it depends on neither app chrome nor any data fetch of its own.
 */

export const metadata: Metadata = {
  title: "Offline / Suhail",
  robots: { index: false, follow: false },
};

export default function Offline() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <BrandMark size={36} />
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-accent-700">
          No signal
        </p>
        <h1 className="mt-2 font-display text-[40px] font-extrabold leading-[1.05] tracking-[-0.02em] text-text sm:text-[56px]">
          The desert wins this one.
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-text/70">
          This page needs a connection Suhail doesn&rsquo;t have right now. An experience or a
          booking you already opened may still be saved on this device — try going back, or
          reconnect and reload.
        </p>
      </div>
      <Button href="/trips" variant="primary">
        See my trips
      </Button>
    </div>
  );
}
