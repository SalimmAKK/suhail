import { cn } from "@/lib/cn";

/* The card-kicker from DESIGN_SYSTEM_REPLACEMENT.md replaces the old gold
   rule and mono treatment: tracked uppercase, accent coloured, no ornament.
   Kept under the Eyebrow name because every section already composes it. */

export function Eyebrow({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  /* light: for sections laid on the dark neutral end */
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-display text-[10px] font-bold uppercase tracking-[0.14em]",
        tone === "light" ? "text-accent-300" : "text-accent-700",
        className,
      )}
    >
      {children}
    </p>
  );
}
