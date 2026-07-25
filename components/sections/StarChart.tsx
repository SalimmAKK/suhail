import { cn } from "@/lib/cn";
import {
  ALULA_LAT,
  alulaEvening,
  equatorialToHorizontal,
  localSiderealTime,
  projectToChart,
  visibleConstellations,
} from "@/lib/astro";

/* CLAUDE.md section 8.1, the signature centrepiece.

   A planisphere for the AlUla sky at 21:00 on a given date. Zenith at the
   centre, horizon on the rim, north up and east to the left, which is how a
   chart reads when you hold it over your head.

   Deliberately a server component. It is a diagram, not an effect: nothing
   here responds to a pointer, so there is no reason to ship it to the client,
   and rendering it on the server is what keeps the hero free of layout shift.
   The draw-in is CSS, gated on the .js root class, so a browser without
   JavaScript gets the finished chart rather than an empty circle.

   Section 8.1 again: it must never look like a screensaver. No twinkling, no
   parallax, no mouse tracking. The ambient starfield behind the hero is a
   separate layer and this component never borrows from it. */

const SIZE = 680;
const C = SIZE / 2;
const R = 310;

/* A star has to be properly up to be worth drawing. Right on the horizon it
   is behind a hill, in haze, or both. */
const HORIZON = 3;
/* names only on the ones a traveller could actually pick out */
const NAMED_ABOVE_MAG = 1.7;

/* Section 8.1 gives r = 3.5 - mag * 0.5. Held, but with the clamp floor
   lifted: at the sizes the hero renders this at, anything under 1.2 user
   units disappeared into the cream entirely. */
const radiusForMag = (mag: number) => Math.min(4, Math.max(1.2, 3.9 - mag * 0.5));

/* Altitude rings, the printed-chart convention. 30 and 60 degrees up. */
const RINGS = [30, 60].map((alt) => ({
  alt,
  r: R * Math.tan(((90 - alt) * Math.PI) / 180 / 2),
}));

const CARDINALS = [
  { label: "N", az: 0 },
  { label: "E", az: 90 },
  { label: "S", az: 180 },
  { label: "W", az: 270 },
];

export function StarChart({
  date,
  lat = ALULA_LAT,
  tone = "cream",
  className,
}: {
  date: Date;
  lat?: number;
  /* which background it sits on. changes stroke weights, not the geometry. */
  tone?: "cream" | "ink";
  className?: string;
}) {
  const evening = alulaEvening(date);
  const lst = localSiderealTime(evening);
  const constellations = visibleConstellations(date, lat);

  const onInk = tone === "ink";
  /* Gold at 40 percent is section 8.1's figure and it reads correctly on ink.
     On cream the same value disappears, so the light variant uses gold-deep
     at a higher alpha to hold the same visual weight. */
  const lineColor = onInk ? "var(--color-gold)" : "var(--color-gold-deep)";
  const lineOpacity = onInk ? 0.4 : 0.7;
  const lineWidth = onInk ? 1 : 1.3;
  const starColor = onInk ? "var(--color-moon)" : "var(--color-ink)";
  const rimColor = onInk ? "var(--color-moon)" : "var(--color-line)";
  const labelColor = onInk ? "var(--color-moon)" : "var(--color-gold-deep)";

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={`Star chart for the AlUla sky at 21:00, showing ${constellations
        .map((c) => c.name)
        .join(", ")}.`}
    >
      {/* the horizon and the altitude rings. the chart's grid paper. */}
      <circle cx={C} cy={C} r={R} fill="none" stroke={rimColor} strokeWidth={1} opacity={onInk ? 0.35 : 1} />
      {RINGS.map((ring) => (
        <circle
          key={ring.alt}
          cx={C}
          cy={C}
          r={ring.r}
          fill="none"
          stroke={rimColor}
          strokeWidth={1}
          strokeDasharray="2 6"
          opacity={onInk ? 0.22 : 0.7}
        />
      ))}

      {CARDINALS.map(({ label, az }) => {
        const rad = (az * Math.PI) / 180;
        const rr = R + 18;
        return (
          <text
            key={label}
            x={C - rr * Math.sin(rad)}
            y={C - rr * Math.cos(rad)}
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-mono"
            fontSize={11}
            letterSpacing="0.1em"
            fill={labelColor}
            opacity={0.75}
          >
            {label}
          </text>
        );
      })}

      {constellations.map((constellation, i) => {
        const points = new Map(
          constellation.stars.map((star) => [
            star.id,
            {
              star,
              ...projectToChart(
                equatorialToHorizontal(star.ra, star.dec, lst, lat),
                C,
                C,
                R,
              ),
            },
          ]),
        );

        const up = [...points.values()].filter((p) => p.alt > HORIZON);
        if (up.length === 0) return null;

        /* A figure is only drawn where both ends of a line are properly up,
           so a constellation half below the horizon degrades to its visible
           part rather than being clipped into nonsense. */
        const segments = constellation.lines
          .map(([a, b]) => [points.get(a), points.get(b)] as const)
          .filter(([a, b]) => a && b && a.alt > HORIZON && b.alt > HORIZON);

        /* Section 6, motion 2: lines draw, then their stars fade in behind
           them, the whole sequence inside 900ms. */
        const lineDelay = i * 20;
        const starDelay = 420 + i * 20;

        return (
          <g key={constellation.slug}>
            {segments.map(([a, b]) => (
              <line
                key={`${a!.star.id}-${b!.star.id}`}
                x1={a!.x}
                y1={a!.y}
                x2={b!.x}
                y2={b!.y}
                stroke={lineColor}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                opacity={lineOpacity}
                pathLength={1}
                className="chart-line"
                style={{ animationDelay: `${lineDelay}ms` }}
              />
            ))}

            {up.map(({ star, x, y }) => (
              <circle
                key={star.id}
                cx={x}
                cy={y}
                r={radiusForMag(star.mag)}
                fill={starColor}
                className="chart-star"
                style={{ animationDelay: `${starDelay}ms` }}
              />
            ))}

            {/* The constellation's own name, set at the centroid of its
                visible stars. Not in section 8.1's list, but a chart of
                figures with no figure names is a scatter plot: this is what
                makes it read as a page from an almanac. Kept quiet enough
                that the stars stay the subject. */}
            {up.length >= 2 ? (
              <text
                /* Under the figure's bounding box, not at its centroid: a
                   centroid sits in the middle of the shape, which is exactly
                   where the stars and lines are. */
                x={(Math.min(...up.map((p) => p.x)) + Math.max(...up.map((p) => p.x))) / 2}
                y={Math.max(...up.map((p) => p.y)) + 16}
                textAnchor="middle"
                className="chart-star chart-figure font-mono hidden sm:inline"
                fontSize={9}
                letterSpacing="0.16em"
                fill={labelColor}
                opacity={0.45}
                style={{ animationDelay: `${starDelay + 120}ms` }}
              >
                {constellation.name.toUpperCase()}
              </text>
            ) : null}

            {up
              .filter(({ star }) => star.name && star.mag < NAMED_ABOVE_MAG)
              .map(({ star, x, y }) => (
                <text
                  key={`${star.id}-label`}
                  x={x + 8}
                  y={y - 7}
                  /* Hidden under sm: the chart scales with its viewBox, so at
                     phone width a 10px label renders at about 5px. A name
                     nobody can read is not a name. */
                  className="chart-star font-mono hidden sm:inline"
                  fontSize={10}
                  letterSpacing="0.08em"
                  fill={labelColor}
                  style={{ animationDelay: `${starDelay + 60}ms` }}
                >
                  {star.name}
                </text>
              ))}
          </g>
        );
      })}
    </svg>
  );
}
