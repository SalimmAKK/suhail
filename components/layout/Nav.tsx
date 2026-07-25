"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn, focusRing } from "@/lib/cn";
import { useNavTone } from "@/lib/useNavTone";

/* CLAUDE.md section 5, the glass nav, as a floating pill rather than a bar.

   It is fixed, not sticky. Sticky reserves its own space in the flow, which
   means nothing ever passes underneath it and backdrop-blur has nothing to
   blur: the glass reads as flat cream and the ink sections never reach the
   band the tone observer watches. Fixed puts the page behind it, which is the
   whole point of the surface.

   Because it is fixed, the first section of every page owes it clearance.
   Sections pad their content down (--nav-clearance in globals.css) and run
   their background to the top of the page, so the ink is behind the glass at
   rest rather than starting below it. */

const LINKS = [
  { href: "/tonight", label: "Tonight" },
  { href: "/sites", label: "Sites" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);
  const tone = useNavTone(ref);
  const onInk = tone === "ink";

  return (
    <header
      ref={ref}
      className={cn(
        "fixed inset-x-4 top-4 z-50 rounded-full border shadow-lift backdrop-blur-md md:inset-x-6 md:top-6",
        "transition-colors duration-300 ease-move",
        onInk ? "border-moon/15 bg-ink/50" : "border-line bg-cream/70",
      )}
    >
      <div className="flex h-14 items-center justify-between gap-4 pl-6 pr-2 md:h-16 md:grid md:grid-cols-[1fr_auto_1fr] md:pl-8 md:pr-3">
        <Link
          href="/"
          className={cn(
            "rounded-full font-display text-xl font-medium tracking-display transition-colors duration-200 ease-move md:justify-self-start",
            focusRing,
            onInk ? "text-moon" : "text-ink",
          )}
        >
          Suhail
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full font-mono text-label uppercase tracking-label transition-colors duration-200 ease-move",
                  focusRing,
                  active
                    ? onInk
                      ? "text-gold"
                      : "text-gold-deep"
                    : onInk
                      ? "text-moon/75 hover:text-moon"
                      : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* The only route into booking in v1 is choosing a night first, so the
            CTA and the Tonight link share a destination. */}
        <Button href="/tonight" variant="accent" size="sm" pill className="md:justify-self-end">
          Book a night
        </Button>
      </div>
    </header>
  );
}
