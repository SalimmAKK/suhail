"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Star, Ticket } from "lucide-react";
import { cn, focusRing } from "@/lib/cn";

/* CLAUDE.md section 4: exactly three icons, each a distinct destination.
   Sky is the star chart and the night picker, Sites is the map, Trips is
   what you have booked. Section 2.2 rule 7 is satisfied because removing any
   one of these loses a destination, not decoration.

   Same floating pill as the desktop nav, inset from the bottom and the sides
   rather than docked full width. It clears the home indicator on iOS by
   adding the safe area inset to its own offset. */

const ITEMS = [
  { href: "/tonight", label: "Sky", Icon: Star },
  { href: "/sites", label: "Sites", Icon: Map },
  { href: "/trips", label: "Trips", Icon: Ticket },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 rounded-full border border-line bg-cream/70 shadow-lift backdrop-blur-md md:hidden"
    >
      <ul className="flex items-stretch">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-full py-2.5 transition-colors duration-200 ease-move",
                  focusRing,
                  active ? "text-gold-deep" : "text-muted",
                )}
              >
                <Icon aria-hidden size={20} strokeWidth={1.5} />
                <span className="font-mono text-label uppercase tracking-label">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
