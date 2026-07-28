"use client";

import { useEffect } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/Button";

/* Catches a thrown error anywhere below the root layout — a Supabase
 * timeout, a bad response, anything a server component didn't handle itself.
 * Without this, that failure surfaces as Next's default error screen, which
 * like the default 404 is unstyled and outside this system.
 *
 * Error boundaries render in place of the segment that threw, which means
 * this can mount inside app/(platform)/layout.tsx's <main> with the app
 * chrome still on screen, or standalone if the failure happened in the root
 * layout itself — the layout below still tries to look coherent either way.
 *
 * Must be a client component: Next requires it, since an error boundary has
 * to catch failures during render, which only a client component can do.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-bg px-6 text-center">
      <BrandMark size={36} />
      <div>
        <p className="font-display text-[13px] font-bold uppercase tracking-[0.14em] text-accent-2-700">
          Something went wrong
        </p>
        <h1 className="mt-2 font-display text-[32px] font-extrabold leading-[1.1] tracking-[-0.02em] text-text sm:text-[40px]">
          The sky didn&rsquo;t load.
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-[1.6] text-text/70">
          This is a real error rather than an empty page. Try again, or head back and pick a
          different night.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Back to Suhail
        </Button>
      </div>
    </div>
  );
}
