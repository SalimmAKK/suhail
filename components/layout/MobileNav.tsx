"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Star, Ticket } from "lucide-react";
import { cn, focusRing } from "@/lib/cn";

/* CLAUDE.md section 4: exactly three icons, each a distinct destination.
   That requirement is about routes, not styling, so it survives the re-skin.

   Restyled to the new system: a solid bar flush to the bottom edge with a
   2px top divider, square, no glass and no float. */

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
      className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-text bg-bg pb-[env(safe-area-inset-bottom)] md:hidden"
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
                  "flex flex-col items-center gap-1 py-3 transition-colors duration-150 ease-move",
                  focusRing,
                  active ? "text-accent-700" : "text-neutral-700",
                )}
              >
                <Icon aria-hidden size={20} strokeWidth={2} />
                <span className="font-display text-[11px] font-bold uppercase tracking-label">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
