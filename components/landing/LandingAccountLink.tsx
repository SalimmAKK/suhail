"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onSessionChange } from "@/lib/auth";
import { cn, focusRing } from "@/lib/cn";

/* The landing page's own doc comment used to explain dropping "Sign in"
 * from this nav: "There is no account in this product." That stopped being
 * true once migrations/003_accounts.sql shipped, and a first-time visitor
 * landing here had no way to reach /login without first clicking into the
 * platform to find TopBar's cell. This is that cell's landing-page twin,
 * session-aware the same way. */

export function LandingAccountLink() {
  const [signedIn, setSignedIn] = useState<boolean | undefined>(undefined);
  useEffect(() => onSessionChange((session) => setSignedIn(Boolean(session))), []);

  if (signedIn === undefined) return null;

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className={cn(
        "whitespace-nowrap font-display text-[12px] font-bold uppercase tracking-[0.14em]",
        "text-[var(--sky-text)]/85 transition-colors duration-150 ease-move hover:text-accent",
        focusRing,
      )}
    >
      {signedIn ? "Account" : "Sign in"}
    </Link>
  );
}
