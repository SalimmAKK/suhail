"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/* CLAUDE.md section 6, motion 1. Section entries, 700ms, staggered by delay.
   Progressive enhancement: the hidden state (.reveal-hidden in globals.css)
   only applies under the .js root class, so content is never hidden in a
   browser that cannot run the script that reveals it. */

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* Under reduced motion there is nothing to observe: .reveal-hidden is
       itself gated on (prefers-reduced-motion: no-preference) in globals.css,
       so the content is already visible and stays that way. */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-[700ms] ease-move motion-reduce:transition-none",
        !shown && "reveal-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
