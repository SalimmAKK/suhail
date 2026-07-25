"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* CLAUDE.md section 5, the glass nav: cream glass over light sections, ink
   glass over dark ones. Rather than hard-coding which routes are dark, any
   section can declare itself by carrying data-nav-tone="ink", and the nav
   watches for one of them crossing the strip it occupies.

   Stage 4 onward: put data-nav-tone="ink" on every full-ink section. */

export const NAV_HEIGHT = 64;

export type NavTone = "light" | "ink";

export function useNavTone(): NavTone {
  const pathname = usePathname();
  const [tone, setTone] = useState<NavTone>("light");

  /* Reset on navigation, during render rather than in an effect: the new
     route's sections have not been observed yet, and a page with no ink
     sections would otherwise inherit the previous page's tone. */
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setTone("light");
  }

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const intersecting = new Set<Element>();

    const attach = () => {
      observer?.disconnect();
      intersecting.clear();

      const targets = document.querySelectorAll('[data-nav-tone="ink"]');
      if (targets.length === 0) return;

      /* Collapse the viewport to the band the nav sits in, so a section
         counts only while it is actually behind the glass. */
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) intersecting.add(entry.target);
            else intersecting.delete(entry.target);
          }
          setTone(intersecting.size > 0 ? "ink" : "light");
        },
        {
          rootMargin: `0px 0px -${Math.max(0, window.innerHeight - NAV_HEIGHT)}px 0px`,
        },
      );

      targets.forEach((target) => observer?.observe(target));
    };

    attach();
    /* rootMargin is computed from viewport height, so it goes stale on resize */
    window.addEventListener("resize", attach);
    return () => {
      window.removeEventListener("resize", attach);
      observer?.disconnect();
    };
  }, [pathname]);

  return tone;
}
