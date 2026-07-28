"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket } from "lucide-react";
import { BrandMark } from "@/components/layout/BrandMark";
import { cn, focusRing } from "@/lib/cn";

/* The single top bar every view shares. 56px, 2px bottom divider, three
   groups: brand, tabs, status cells.

   Two departures from the handoff's bar, both deliberate.

   The handoff's fifth tab is Operators. CLAUDE.md section 2.4 rule 17 keeps
   that route out of public navigation, and that is a decision about access to
   booking data rather than a style one, so Sites takes the cell instead. It is
   a real destination with real pages behind it, and it keeps the strip at the
   five cells the design draws.

   The handoff's last cell is an avatar with a person's initials. There is no
   account in this product, so initials would imply a signed-in traveller who
   does not exist. The cell keeps its 28px ink square and becomes the entry to
   My trips, which is the thing a returning traveller actually wants from that
   corner. */

const TABS = [
  { href: "/discover", label: "Tonight" },
  { href: "/search", label: "Search" },
  { href: "/sky", label: "The Sky" },
  { href: "/sites", label: "Sites" },
  { href: "/trips", label: "My trips" },
];

function isActive(pathname: string, href: string): boolean {
  /* An experience detail page is still "Tonight": it is where the discovery
     list sends you, and there is no tab of its own to light up. */
  if (href === "/discover") return pathname === "/discover" || pathname.startsWith("/experiences");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopBar({ nightLabel }: { nightLabel: string }) {
  const pathname = usePathname();

  return (
    /* Sticky, as the nav it replaces was. The three fixed-height views never
       scroll the document so it makes no difference there; on the detail page
       and the older scrolling routes it keeps the tab strip reachable.

       Below md the five-tab strip and the four-cell status cluster measured
       967px on their own — wider than any phone — with MobileNav's bottom bar
       rendering underneath at the same time. The tab strip and status cluster
       are md:flex now, matching the bottom bar's own md:hidden, and mobile
       gets a single compact cell instead: just the night label, which is the
       one piece of that cluster worth the width on a screen this size. Search
       has no icon in MobileNav's three (CLAUDE.md section 4 caps it there),
       so it stays reachable from within the pages that link to it rather than
       from primary nav on mobile — the same gap the original desktop-only Nav
       had before Search existed as a route. */
    <header className="sticky top-0 z-50 flex h-[var(--topbar-h)] shrink-0 items-stretch border-b-2 border-divider bg-bg">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2.5 border-r-2 border-divider px-4 md:min-w-[260px] md:px-5",
          focusRing,
        )}
      >
        <BrandMark />
        <span className="font-display text-[18px] font-extrabold tracking-[-0.01em] text-text md:text-[20px]">
          Suhail
        </span>
        <span className="ml-auto hidden text-[11px] uppercase tracking-[0.14em] text-text/60 md:inline">
          AlUla &middot; KSA
        </span>
      </Link>

      <nav aria-label="Primary" className="hidden flex-1 items-center pr-5 md:flex">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-full items-center border-r border-divider px-5",
                "text-[13px] uppercase tracking-[0.06em] transition-colors duration-150 ease-move",
                focusRing,
                active ? "text-text" : "text-text/65 hover:bg-text/4 hover:text-text",
              )}
            >
              {tab.label}
              {/* Flush with the bar's own bottom border, not above it. */}
              {active ? (
                <span aria-hidden className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-accent" />
              ) : null}
            </Link>
          );
        })}

        <div className="ml-auto flex h-full items-center">
          <span className="tnum inline-flex h-full items-center border-l border-divider px-4 text-[12px] uppercase tracking-[0.06em] text-accent-700">
            {nightLabel}
          </span>
          {/* Not switchers. The product is in English and prices in SAR, and
              these say so rather than offering a control that does nothing. */}
          <span className="inline-flex h-full items-center border-l border-divider px-4 text-[12px] uppercase tracking-[0.06em] text-text/70">
            EN
          </span>
          <span className="inline-flex h-full items-center border-l border-divider px-4 text-[12px] uppercase tracking-[0.06em] text-text/70">
            SAR
          </span>
          <span className="inline-flex h-full items-center border-l border-divider px-4">
            <Link
              href="/trips"
              aria-label="My trips"
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center bg-neutral-800 text-bg",
                "transition-colors duration-150 ease-move hover:bg-text",
                focusRing,
              )}
            >
              <Ticket aria-hidden size={15} strokeWidth={2.2} />
            </Link>
          </span>
        </div>
      </nav>

      <div className="ml-auto flex items-center px-4 md:hidden">
        <span className="tnum whitespace-nowrap text-[11px] uppercase tracking-[0.06em] text-accent-700">
          {nightLabel}
        </span>
      </div>
    </header>
  );
}
