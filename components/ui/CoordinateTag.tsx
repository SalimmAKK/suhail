import { cn } from "@/lib/cn";

/* The coordinate strip, now in the h6 treatment rather than a mono face:
   Archivo, 13px, tracked and uppercased. Same data, same separators. */

export function CoordinateTag({
  items,
  tone = "default",
  className,
}: {
  items: string[];
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-label font-bold uppercase tracking-label",
        tone === "light" ? "text-neutral-400" : "text-neutral-700",
        className,
      )}
    >
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-x-2.5">
          {i > 0 ? (
            <span aria-hidden className="text-accent-600">
              &middot;
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </p>
  );
}
