import { cn } from "@/lib/cn";

/* CLAUDE.md section 5, the coordinate tag: a mono row of data fields with a
   dot between them. `26.85°N · ALULA · 692M · BORTLE 2`. It sits under
   section headings and site names. Data as ornament, but the data is real. */

export function CoordinateTag({
  items,
  tone = "default",
  className,
}: {
  items: string[];
  /* light: for ink sections */
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-label uppercase tracking-label",
        tone === "light" ? "text-moon/70" : "text-muted",
        className,
      )}
    >
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-x-2.5">
          {i > 0 ? (
            <span aria-hidden className={tone === "light" ? "text-gold" : "text-gold-deep"}>
              &middot;
            </span>
          ) : null}
          {item}
        </span>
      ))}
    </p>
  );
}
