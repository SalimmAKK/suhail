"use client";

import { useCallback, useRef, useState } from "react";
import { SkyPip } from "@/components/ui/SkyPip";
import { cn, focusRing } from "@/lib/cn";
import { SKY_QUALITY_LABEL, parseDateKey, skyQuality, type SkyQuality } from "@/lib/astro";

/* The sixty-night calendar, lifted out of NightPicker so the picker page and
   the discovery view's "Pick a date" chip drive the same grid rather than two
   that drift apart. The panel that reads a selection stays in NightPicker;
   this is only the cells.

   The roving tabindex lives here because it belongs to the grid: sixty
   buttons in the tab order would be a wall to get past, so the group takes one
   tab stop and the arrow keys move within it. */

const COLUMNS = 6;

/* the ramp, per CLAUDE.md section 5. the dark end is the dark sky. */
const FILL: Record<SkyQuality, string> = {
  prime: "bg-neutral-900",
  ok: "bg-neutral-500",
  bright: "bg-neutral-200",
};

const CELL_TEXT: Record<SkyQuality, string> = {
  /* follows the fill: a prime night is the dark end of the ramp and needs
     light type on it, the other two are light enough to take ink */
  prime: "text-neutral-100",
  ok: "text-text",
  bright: "text-text",
};

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });
const FULL_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function NightGrid({
  nights,
  selected,
  onSelect,
  columns = COLUMNS,
  showLegend = true,
  className,
}: {
  /** date keys, already fixed on the server */
  nights: string[];
  selected: string | null;
  onSelect: (key: string) => void;
  columns?: number;
  showLegend?: boolean;
  className?: string;
}) {
  const [focusIndex, setFocusIndex] = useState(0);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = useCallback(
    (from: number, delta: number) => {
      const next = Math.min(nights.length - 1, Math.max(0, from + delta));
      setFocusIndex(next);
      cellRefs.current[next]?.focus();
    },
    [nights.length],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const moves: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns,
        ArrowUp: -columns,
      };
      if (event.key in moves) {
        event.preventDefault();
        move(index, moves[event.key]);
        return;
      }
      if (event.key === "Home") {
        event.preventDefault();
        move(index, -index);
      }
      if (event.key === "End") {
        event.preventDefault();
        move(index, nights.length - 1 - index);
      }
    },
    [move, nights.length, columns],
  );

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={`The next ${nights.length} nights over AlUla`}
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {nights.map((key, i) => {
          const date = parseDateKey(key);
          const quality = skyQuality(date);
          const isSelected = selected === key;
          const day = date.getDate();

          return (
            <button
              key={key}
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={`${FULL_DATE.format(date)}. ${SKY_QUALITY_LABEL[quality]}.`}
              onKeyDown={(e) => onKeyDown(e, i)}
              onFocus={() => setFocusIndex(i)}
              onClick={() => onSelect(key)}
              className={cn(
                "relative aspect-square overflow-hidden border transition-colors duration-200 ease-move",
                focusRing,
                isSelected
                  ? "border-accent-700 ring-2 ring-accent-700"
                  : "border-divider hover:border-text",
              )}
            >
              {/* Motion 3: the quality colour fills from the bottom, staggered
                  by row. Gated on .js so the grid is already filled and
                  readable before hydration. */}
              <span
                aria-hidden
                className={cn("cell-fill absolute inset-0 origin-bottom", FILL[quality])}
                style={{ animationDelay: `${Math.floor(i / columns) * 40}ms` }}
              />
              <span
                className={cn(
                  "relative flex h-full w-full flex-col items-center justify-center gap-0.5 font-display text-[13px] leading-none",
                  CELL_TEXT[quality],
                )}
              >
                {day}
                {day === 1 ? (
                  <span className="text-[9px] uppercase tracking-label opacity-80">
                    {MONTH.format(date)}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {showLegend ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <SkyPip quality="prime" />
          <SkyPip quality="ok" />
          <SkyPip quality="bright" />
        </div>
      ) : null}
    </div>
  );
}
