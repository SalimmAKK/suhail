import { cn } from "@/lib/cn";

/* CLAUDE.md section 5, the moon phase indicator. Takes `phase`, 0 (new) to
   1 (full), matching what lib/astro.ts will return in stage 3.

   The lit shape is a semicircle joined to the terminator ellipse. The
   ellipse's x radius is r * |1 - 2*phase|, and it either bulges into the lit
   half (crescent) or away from it (gibbous). At phase 0 the two arcs cancel
   and nothing is lit. At phase 1 they form the full disc. That is the whole
   geometry, no images and no masks. */

const R = 50;
const C = 50;

export function moonPhaseLabel(phase: number): string {
  if (phase < 0.03) return "New moon";
  if (phase < 0.47) return "Crescent";
  if (phase < 0.53) return "Half moon";
  if (phase < 0.97) return "Gibbous";
  return "Full moon";
}

function litPath(phase: number): string {
  const rx = R * Math.abs(1 - 2 * phase);
  /* The first arc runs down the lit limb clockwise, so the terminator returns
     bottom to top. Counter-clockwise (0) brings it back through the lit half
     and carves a crescent; clockwise (1) swings it through the dark half and
     fills out a gibbous.

     Sanity check the ends rather than trusting the reading: at phase 0 the
     return arc has rx = R and retraces the first arc exactly, enclosing
     nothing. At phase 1 it sweeps the other semicircle and closes the full
     disc. Getting this backwards renders a new moon as full, which is what it
     did until the night picker put a 21% crescent on screen next to the
     number and the two disagreed. */
  const sweep = phase < 0.5 ? 0 : 1;
  return [
    `M ${C},${C - R}`,
    `A ${R},${R} 0 0 1 ${C},${C + R}`,
    `A ${rx},${R} 0 0 ${sweep} ${C},${C - R}`,
    "Z",
  ].join(" ");
}

export function MoonPhase({
  phase,
  /* which limb is lit. waxing lights the right side, as seen from the
     northern hemisphere, which is where AlUla is. */
  waxing = true,
  size = 40,
  tone = "default",
  className,
}: {
  phase: number;
  waxing?: boolean;
  size?: number;
  /* light: for ink sections, where the unlit disc has to read against ink */
  tone?: "default" | "light";
  className?: string;
}) {
  const clamped = Math.min(1, Math.max(0, phase));
  const label = `${moonPhaseLabel(clamped)}, ${Math.round(clamped * 100)} percent lit`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className={cn("shrink-0", className)}
    >
      {/* the unlit disc. sky-1 is the ramp's brightest-sky, darkest-surface
          end, which is exactly what an unlit moon face is. */}
      <circle
        cx={C}
        cy={C}
        r={R}
        className={tone === "light" ? "fill-sky-1" : "fill-ink"}
      />
      <g transform={waxing ? undefined : `translate(${2 * C},0) scale(-1,1)`}>
        <path d={litPath(clamped)} className="fill-moon" />
      </g>
      <circle
        cx={C}
        cy={C}
        r={R - 0.5}
        fill="none"
        strokeWidth={1}
        className={tone === "light" ? "stroke-moon/25" : "stroke-ink/20"}
      />
    </svg>
  );
}
