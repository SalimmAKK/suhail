import { cn } from "@/lib/cn";

/* DESIGN_SYSTEM_REPLACEMENT.md: flat surface, no border, square. The gold
   rule that swept in on hover is gone; elevation carries the hover instead. */

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
        lift && "transition-shadow duration-200 ease-move hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}
