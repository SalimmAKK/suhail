import { cn } from "@/lib/cn";

/* CLAUDE.md section 5, the ambient starfield, and section 6 motion 8.

   Atmosphere, not content. Fifty points, each twinkling on its own 4 to 8
   second cycle, with the whole layer drifting 8px sideways over 60 seconds.
   If you cannot tell it is there without looking for it, it is working.

   Positions come from a seeded generator rather than Math.random, so the
   server and the client produce the same field and React does not throw a
   hydration mismatch over decorative dots. Same reason this can stay a
   server component: it is CSS motion over static markup.

   The tone matters more than it looks. Section 5 specifies 30 to 60 percent
   opacity, which is calibrated for ink sections where the points are light on
   dark. On cream the same values read as dirt on the page, so the light
   variant uses ink points at roughly a third of that. It reads as the stipple
   on printed chart paper.

   Section 6 also bans a second animated background layer, so this is the only
   one in the product.

   Section 5 requires the field never to overlap the star chart's viewBox.
   That is the caller's job, not a keep-out circle in here: the layer is
   stretched to whatever box it is given, so an exclusion zone expressed in
   its own coordinates is an ellipse on screen and misses. The hero bounds the
   layer to the region the chart does not occupy, which differs between the
   stacked mobile layout and the side-by-side desktop one. */

const COUNT = 52;

/** mulberry32. Small, fast, and identical on both sides of hydration. */
function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Speck = { x: number; y: number; r: number; duration: number; delay: number };

function field(): Speck[] {
  const random = seeded(0x5548414c); /* "SUHA" */
  const out: Speck[] = [];

  while (out.length < COUNT) {
    out.push({
      x: random() * 100,
      y: random() * 100,
      /* section 5: 1 to 2 px, as a device-pixel stroke width */
      r: 1 + random(),
      /* section 6 motion 8: independent 4 to 8 second cycles */
      duration: 4 + random() * 4,
      delay: random() * 8,
    });
  }
  return out;
}

const SPECKS = field();

export function AmbientStars({
  tone = "ink",
  className,
}: {
  tone?: "ink" | "cream";
  className?: string;
}) {
  const onInk = tone === "ink";

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="ambient-drift h-full w-full"
      >
        {SPECKS.map((s, i) => (
          /* A zero-length round-capped line, not a circle. The viewBox is
             stretched to the hero, so a circle's radius would scale with it
             and section 5's 1 to 2px specks would land at six or more. Stroke
             width under non-scaling-stroke stays in device pixels, which is
             the one dimension here that must not scale. */
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={s.x}
            y2={s.y}
            strokeWidth={s.r}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            stroke={onInk ? "var(--color-neutral-100)" : "var(--color-text)"}
            className="ambient-star"
            style={{
              /* the resting opacity, and the ceiling the twinkle reaches */
              ["--twinkle-low" as string]: onInk ? 0.3 : 0.1,
              ["--twinkle-high" as string]: onInk ? 0.6 : 0.2,
              animationDuration: `${s.duration}s`,
              animationDelay: `-${s.delay}s`,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
