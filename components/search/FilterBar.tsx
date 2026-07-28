"use client";

import { ChevronDown } from "lucide-react";
import { cn, focusRing } from "@/lib/cn";

/* The six-column filter bar.
 *
 * Each cell is a label over a value, with a 1px rule between cells and a 2px
 * rule under the row. The value is a real <select> styled to look like the
 * mock's "value ▾" — a native control rather than a custom menu, because it
 * is keyboard-operable and screen-reader-legible for free, and at this size
 * nothing about a custom popover would look different.
 */

export type FilterCell = {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
};

export function FilterBar({
  cells,
  onChange,
}: {
  cells: FilterCell[];
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div
      className="grid border-b-2 border-divider"
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <div key={cell.id} className="border-r border-divider px-3 py-3.5 last:border-r-0">
          <label
            htmlFor={`filter-${cell.id}`}
            className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-text/60"
          >
            {cell.label}
          </label>
          <div className="relative flex items-center justify-between gap-2">
            <select
              id={`filter-${cell.id}`}
              value={cell.value}
              onChange={(e) => onChange(cell.id, e.target.value)}
              className={cn(
                "w-full cursor-pointer appearance-none truncate bg-transparent font-display text-[14px] font-extrabold text-text",
                focusRing,
              )}
            >
              {cell.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              size={13}
              strokeWidth={2.5}
              className="pointer-events-none shrink-0 text-text"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
