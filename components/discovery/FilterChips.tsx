"use client";

import { cn, focusRing } from "@/lib/cn";

/* The flush chip strip under the discovery header.
 *
 * Chips butt against each other with a 1px rule between and no gap, which is
 * what makes the row read as one strip rather than seven buttons. The active
 * chip fills ink and flips its label to ground.
 *
 * Every chip here does something. The mock draws seven; this renders the ones
 * that have a filter behind them plus the date panel trigger, because a chip
 * that toggles nothing is the decoration CLAUDE.md rule 2.2/7 rules out.
 */

export type ChipDef = {
  id: string;
  label: string;
  /** the accent square the mock puts on the sky-quality chip */
  dot?: boolean;
};

export function FilterChips({
  chips,
  active,
  onToggle,
  className,
}: {
  chips: ChipDef[];
  active: Set<string>;
  onToggle: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex overflow-x-auto border-b-2 border-divider px-7", className)}
      role="group"
      aria-label="Filter experiences"
    >
      {chips.map((chip, i) => {
        const on = active.has(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onToggle(chip.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-r border-divider px-[18px] py-3",
              "text-[12px] uppercase tracking-[0.08em] transition-colors duration-150 ease-move",
              focusRing,
              i === 0 && "border-l border-divider",
              on
                ? "border-text bg-text text-bg"
                : "text-text/65 hover:bg-text/4 hover:text-text",
            )}
          >
            {chip.dot ? (
              <span
                aria-hidden
                className={cn("h-1.5 w-1.5 shrink-0", on ? "bg-bg" : "bg-accent")}
              />
            ) : null}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
