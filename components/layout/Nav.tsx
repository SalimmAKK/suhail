"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Shell } from "@/components/layout/Shell";
import { cn, focusRing } from "@/lib/cn";

/* DESIGN_SYSTEM_REPLACEMENT.md: a standard top bar with a 2px bottom
   divider. Not fixed, not floating, not a glass capsule. It is sticky, which
   the document leaves to the implementer, because a booking product wants
   its one CTA reachable without scrolling back up.

   Because it is a normal bar with a solid background, the tone-switching
   glass logic and the clearance token both go: nothing passes behind it, so
   there is nothing to re-tone against.

   Operators is deliberately absent. CLAUDE.md section 2.4 rule 17 keeps that
   route out of public navigation, and that is a scope decision about access
   to booking data rather than a style one. */

const LINKS = [
  { href: "/tonight", label: "Tonight" },
  { href: "/sites", label: "Sites" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b-2 border-text bg-bg">
      <Shell className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className={cn(
            "font-display text-xl font-extrabold tracking-display text-text",
            focusRing,
          )}
        >
          Suhail
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-display text-label font-bold uppercase tracking-label transition-colors duration-150 ease-move",
                  focusRing,
                  active ? "text-accent-700" : "text-neutral-700 hover:text-text",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Button href="/tonight" size="sm">
          Book a night
        </Button>
      </Shell>
    </header>
  );
}
