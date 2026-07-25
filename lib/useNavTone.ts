"use client";

import { useEffect, useState, type RefObject } from "react";
import { usePathname } from "next/navigation";

/* CLAUDE.md section 5, the glass nav: cream glass over light sections, ink
   glass over dark ones. Rather than hard-coding which routes are dark, any
   section can declare itself by carrying data-nav-tone="ink", and the nav
   watches for one of them crossing the band it floats over.

   The band is measured from the pill itself rather than assumed, because the
   inset and the height both change at md. The pill is fixed, so its rect is
   stable until the viewport resizes.

   Stage 4 onward: put data-nav-tone="ink" on every full-ink section. Sections
   must run their background to the top of the page, not start below the pill,
   or there is nothing behind the glass to blur. */

export type NavTone = "light" | "ink";

export function useNavTone(ref: RefObject<HTMLElement | null>): NavTone {
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

      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;

      /* Collapse the viewport down to the strip the pill occupies, so a
         section counts only while it is actually behind the glass. */
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) intersecting.add(entry.target);
            else intersecting.delete(entry.target);
          }
          setTone(intersecting.size > 0 ? "ink" : "light");
        },
        {
          rootMargin: [
            `-${Math.round(rect.top)}px`,
            "0px",
            `-${Math.max(0, Math.round(window.innerHeight - rect.bottom))}px`,
            "0px",
          ].join(" "),
        },
      );

      targets.forEach((target) => observer?.observe(target));
    };

    attach();
    /* rootMargin is derived from the pill's rect and the viewport height, so
       both go stale on resize */
    window.addEventListener("resize", attach);
    return () => {
      window.removeEventListener("resize", attach);
      observer?.disconnect();
    };
  }, [pathname, ref]);

  return tone;
}
