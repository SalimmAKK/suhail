"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* CLAUDE.md section 6, motion 1: display headings reveal line by line behind
   a clip mask, each line rising 100 percent from below, 700ms, 90ms stagger.
   Use on the hero h1 and section pull-headings, nowhere else.

   Same progressive enhancement as Reveal: the hidden state (.lr-hidden in
   globals.css) only applies under the .js root class and when motion is
   allowed, so the heading is always visible and correct without JavaScript. */

export function LineReveal({
  as: Tag = "h2",
  lines,
  className,
}: {
  as?: "h1" | "h2";
  /* one entry per visual line. Plain strings cover most headings; a line
     needing inline styling (the hero's gold-accented half-line) can pass a
     fragment instead — ReactNode covers both. */
  lines: React.ReactNode[];
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Under reduced motion there is nothing to observe: .lr-hidden is itself
       gated on (prefers-reduced-motion: no-preference) in globals.css, so the
       heading is already visible and stays that way. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, i) => (
        /* the mask. padding keeps descenders unclipped at rest. */
        <span key={i} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
          <span
            style={i ? { transitionDelay: `${i * 90}ms` } : undefined}
            className={cn(
              "block transition-transform duration-[700ms] ease-move motion-reduce:transition-none",
              !shown && "lr-hidden",
            )}
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}
