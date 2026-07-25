import { cn } from "@/lib/cn";

/* CLAUDE.md section 5, the status pip: a mono label plus one dot, carrying
   the sky-quality ramp. Applied to date cells in the night picker and to any
   surface that has to say what kind of night this is.

   The dot is the semantic part. The ramp colours are tuned for ink
   backgrounds, so on cream the dot gets a hairline ring to stay visible. */

export type SkyQuality = "prime" | "ok" | "bright";

const QUALITY: Record<SkyQuality, { label: string; dot: string }> = {
  prime: { label: "Prime night", dot: "bg-sky-5" },
  ok: { label: "Ok night", dot: "bg-sky-3" },
  bright: { label: "Bright night", dot: "bg-sky-1" },
};

export function SkyPip({
  quality,
  tone = "default",
  showLabel = true,
  className,
}: {
  quality: SkyQuality;
  /* light: for ink sections */
  tone?: "default" | "light";
  /* the dot alone, for dense surfaces like calendar cells */
  showLabel?: boolean;
  className?: string;
}) {
  const { label, dot } = QUALITY[quality];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-label uppercase tracking-label",
        tone === "light" ? "text-moon/80" : "text-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          dot,
          tone === "default" && "ring-1 ring-inset ring-ink/15",
        )}
      />
      {showLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}
