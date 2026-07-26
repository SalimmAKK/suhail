import { CoordinateTag } from "@/components/ui/CoordinateTag";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { SkyPip } from "@/components/ui/SkyPip";
import { cn } from "@/lib/cn";
import {
  ALULA_LAT,
  isWaxing,
  moonPhase,
  moonPhaseLabel,
  parseDateKey,
  skyQuality,
  visibleConstellations,
} from "@/lib/astro";

/* The sky attached to a specific slot, shown while booking and again on the
   confirmation.

   The point is that a traveller is booking a particular night, not a generic
   slot, and the product already knows what that night will be like. Every
   figure here comes from lib/astro.ts, computed from the date alone.

   Deliberately not shown: moonrise and moonset times. Those are a reasonable
   thing to want here and the maths for them is not in this codebase, so the
   block says less rather than saying something unverified. */

/** `a, b and c`, rather than five constellations chained with "and". */
function list(names: string[]): string {
  const shown = names.slice(0, 3);
  if (shown.length === 1) return shown[0];
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

export function SkyAtSlot({
  dateKey,
  tone = "default",
  className,
}: {
  dateKey: string;
  tone?: "default" | "light";
  className?: string;
}) {
  const date = parseDateKey(dateKey);
  const phase = moonPhase(date);
  const quality = skyQuality(date);
  const constellations = visibleConstellations(date, ALULA_LAT);
  const milkyWay = constellations.filter((c) => c.targets.includes("milky-way-core"));
  const onInk = tone === "light";

  return (
    <div
      className={cn(
        "border-2 p-5",
        onInk ? "border-neutral-700 bg-neutral-900" : "border-divider bg-surface",
        className,
      )}
    >
      <p
        className={cn(
          "font-display text-label uppercase tracking-label",
          onInk ? "text-accent" : "text-accent-700",
        )}
      >
        The sky on this night
      </p>

      <div className="mt-4 flex items-center gap-4">
        <MoonPhase phase={phase} waxing={isWaxing(date)} size={44} tone={tone} />
        <div>
          <p className={cn("first-letter:uppercase", onInk ? "text-neutral-100" : "text-text")}>
            {moonPhaseLabel(phase)} moon, {Math.round(phase * 100)}% lit
          </p>
          <SkyPip quality={quality} tone={tone} className="mt-1.5" />
        </div>
      </div>

      {milkyWay.length > 0 ? (
        <p className={cn("mt-4 text-[15px]", onInk ? "text-neutral-100/70" : "text-neutral-700")}>
          The Milky Way core is up, through {list(milkyWay.map((c) => c.name))}.
          {quality === "bright"
            ? " The moon will wash out most of it."
            : quality === "prime"
              ? " On a night this dark it is visible to the naked eye."
              : ""}
        </p>
      ) : null}

      <CoordinateTag
        tone={tone}
        className="mt-4"
        items={[`${constellations.length} CONSTELLATIONS UP`, "21:00 ALULA"]}
      />
    </div>
  );
}
