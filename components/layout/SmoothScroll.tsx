"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/* CLAUDE.md section 6, motion 5: Lenis at the root with gentle damping. This
   is smoothed native scroll, not scroll-jacking. Nothing is pinned, nothing
   is hijacked, and the wheel still travels the distance it asked for.

   Under prefers-reduced-motion Lenis never starts, so scrolling stays exactly
   as the browser does it. */

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      /* the section 6 easing, expressed as the exponential Lenis wants */
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.6,
    });

    let frame = requestAnimationFrame(function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
