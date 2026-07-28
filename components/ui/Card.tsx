import { cn } from "@/lib/cn";

/* DESIGN_SYSTEM_REPLACEMENT.md: flat surface, no border, square. The gold
   rule that swept in on hover is gone; elevation carries the hover instead.
   Motion system: a small physical lift (-3px) travels with the shadow
   rather than the shadow alone, which is what makes hover read as the card
   coming toward you instead of just gaining a drop shadow underneath a
   static rectangle. 200ms, the system's small-movement duration. */

export function Card({
  children,
  lift = false,
  className,
}: {
  children: React.ReactNode;
  lift?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-surface p-6",
        lift &&
          "transition-[transform,box-shadow] duration-200 ease-move hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
