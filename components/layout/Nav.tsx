"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Shell } from "@/components/layout/Shell";
import { cn, focusRing } from "@/lib/cn";
import { useNavTone } from "@/lib/useNavTone";

/* CLAUDE.md section 5, the glass nav. This is the one glass surface in the
   product: backdrop-blur over a translucent base, hairline bottom border, and
   it re-tones itself when a full-ink section passes behind it.

   Under md the link list drops out and the bottom nav (MobileNav) takes over
   navigation, but the bar itself stays so every viewport keeps the wordmark
   and the one CTA. */

const LINKS = [
  { href: "/tonight", label: "Tonight" },
  { href: "/sites", label: "Sites" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Nav() {
  const pathname = usePathname();
  const tone = useNavTone();
  const onInk = tone === "ink";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-colors duration-300 ease-move",
        onInk ? "border-moon/15 bg-ink/40" : "border-line bg-cream/60",
      )}
    >
      <Shell className="flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className={cn(
            "rounded-sm font-display text-xl font-medium tracking-display transition-colors duration-200 ease-move",
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
                  "rounded-sm font-mono text-label uppercase tracking-label transition-colors duration-200 ease-move",
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
        <Button href="/tonight" variant="accent" size="sm">
          Book a night
        </Button>
      </Shell>
    </header>
  );
}
