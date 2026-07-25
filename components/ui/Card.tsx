import { cn } from "@/lib/cn";

/* CLAUDE.md section 5, the standard card treatment: white on cream, hairline
   border, a 3px gold rule across the top that sweeps in on hover (380ms),
   4px lift, deeper shadow. Static cards (lift=false) get no rule and no
   hover behaviour. Do not reinvent this. */

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
        "relative rounded-lg border border-line bg-paper p-6",
        lift &&
          "group overflow-hidden transition-[transform,box-shadow,border-color] duration-200 ease-move motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lift",
        className,
      )}
    >
      {lift ? (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gold transition-transform duration-[380ms] ease-move motion-safe:group-hover:scale-x-100 motion-reduce:transition-none"
        />
      ) : null}
      {children}
    </div>
  );
}
