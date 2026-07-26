import { cn } from "@/lib/cn";

/* Sky quality on the neutral ramp, per DESIGN_SYSTEM_REPLACEMENT.md: the
   dark end is a dark sky, the light end is a moonlit one. That reads as a
   literal light/dark metaphor, which the gold ramp could not. Gold is
   reserved for interactive and brand elements. */

export type SkyQuality = "prime" | "ok" | "bright";

const QUALITY: Record<SkyQuality, { label: string; dot: string }> = {
  prime: { label: "Prime night", dot: "bg-neutral-900" },
  ok: { label: "Ok night", dot: "bg-neutral-500" },
  bright: { label: "Bright night", dot: "bg-neutral-200" },
};

export function SkyPip({
  quality,
  tone = "default",
  showLabel = true,
  className,
}: {
  quality: SkyQuality;
  tone?: "default" | "light";
  showLabel?: boolean;
  className?: string;
}) {
  const { label, dot } = QUALITY[quality];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-label font-bold uppercase tracking-label",
        tone === "light" ? "text-neutral-300" : "text-neutral-700",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("h-2.5 w-2.5 shrink-0 ring-1 ring-inset ring-divider", dot)}
      />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
