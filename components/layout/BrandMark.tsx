import { cn } from "@/lib/cn";

/* The brand mark: a filled accent square with a ground-coloured square inset
   into it, which reads as an inverted C. Plain CSS in the handoff and plain
   CSS here, no asset.

   The inset is 6px on the 22px mark. It scales with the mark rather than
   staying fixed, so the shape holds at the sizes it is used at. */

export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative block shrink-0 bg-accent", className)}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute bg-bg"
        style={{ inset: Math.round((size / 22) * 6) }}
      />
    </span>
  );
}
