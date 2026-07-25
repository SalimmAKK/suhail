"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Star, Ticket } from "lucide-react";
import { cn, focusRing } from "@/lib/cn";

/* CLAUDE.md section 4: exactly three icons, each a distinct destination.
   Sky is the star chart and the night picker, Sites is the map, Trips is
   what you have booked. Section 2.2 rule 7 is satisfied because removing any
   one of these loses a destination, not decoration.

   Same glass as the desktop nav. It sits at the bottom of the viewport rather
   than behind page sections, so it does not re-tone. */

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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-cream/60 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
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
                  "flex flex-col items-center gap-1.5 py-3 transition-colors duration-200 ease-move",
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
