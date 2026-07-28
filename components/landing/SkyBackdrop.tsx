"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/* The fixed night-sky layer the whole landing sits on.
 *
 * IMAGE SUBSTITUTION, deliberate. The design file's backdrop is
 * `uploads/Gemini_Generated_Image_...png` — an AI-generated night sky.
 * CLAUDE.md rule 13 forbids AI-generated imagery for astro or place
 * photography without exception: "real astrophotography, licensed stock, or
 * nothing". This is licensed Unsplash stock instead, which the rule allows and
 * which the rest of the product already uses. The composition it serves — a
 * dark starfield behind everything, scrimmed — is unchanged.
 *
 * The parallax is the design's: the layer drifts up at 0.12 of scroll under a
 * 1.08 scale, so the edges never pull into frame. Lenis animates window
 * scrollY, so this reads window.scrollY on rAF rather than listening for
 * 'scroll', which under smooth scrolling fires at a different cadence than the
 * frames being painted and shows up as judder.
 */

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1502957291543-d85480254bf8?w=2400&q=80&auto=format&fit=crop";

export function SkyBackdrop() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = -1;

    const tick = () => {
      const y = window.scrollY;
      if (y !== last && layer.current) {
        last = y;
        layer.current.style.transform = `translateY(${y * -0.12}px) scale(1.08)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={layer}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 will-change-transform"
      style={{ transform: "scale(1.08)" }}
    >
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        /* Duotoned like every other photograph in the product, so the landing
           and the platform read as one thing rather than a blue hero bolted
           onto a gold app. */
        className="photo-duotone object-cover"
      />
      {/* the design's scrim: darkest at top and bottom so the nav and the
          lower stat row keep their contrast over any part of the photograph */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,9,8,.62) 0%, rgba(10,9,8,.35) 40%, rgba(10,9,8,.72) 100%)",
        }}
      />
    </div>
  );
}
