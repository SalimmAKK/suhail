import { cn } from "@/lib/cn";

/* Ported from edu-hub, where the inline mark was a BandChip. Suhail has no
   rubric bands, so the mark is the short gold rule the section eyebrows in
   CLAUDE.md section 5 are written with ("— TONIGHT OVER ALULA"). */

export function Eyebrow({
  children,
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  /* light: for ink sections. text-muted on ink fails contrast at 3:1. */
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2.5 font-mono text-label font-medium uppercase tracking-label",
        tone === "light" ? "text-moon/75" : "text-muted",
        className,
      )}
    >
      <span aria-hidden className="h-px w-5 shrink-0 bg-gold" />
      {children}
    </p>
  );
}
