import Link from "next/link";
import { cn, focusRing } from "@/lib/cn";

/* DESIGN_SYSTEM_REPLACEMENT.md. Four variants, square corners, no pill.
   The old primary/accent/light system and the `pill` prop are gone.

   One deviation, flagged rather than taken quietly: the document specifies
   btn-primary as accent background with --color-bg text. Cream on gold is
   about 2:1, which fails AA, and this is the button that carries every
   conversion in the product. The earlier decision to put ink on gold was
   made on exactly this measurement and is recorded in CLAUDE.md section 5.
   Ink on gold is about 7:1, so it stays. */
type Variant = "primary" | "secondary" | "ghost" | "icon";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-text hover:bg-accent-600",
  secondary: "border-2 border-text bg-transparent text-text hover:bg-text hover:text-bg",
  ghost: "bg-transparent text-accent-700 hover:text-text",
  icon: "border-2 border-divider bg-transparent text-text hover:border-text",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-2 text-[13px]",
  md: "px-5 py-2.5 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type AnchorProps = CommonProps & { href: string; target?: string; rel?: string };

type NativeProps = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Button(props: AnchorProps | NativeProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.06em] transition-colors duration-150 ease-move",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-40",
    variant === "icon" ? "h-9 w-9 p-0" : SIZES[size],
    VARIANTS[variant],
    className,
  );

  if (props.href !== undefined) {
    /* CLAUDE.md section 2.2 rule 8: a link either works or does not exist */
    if (props.href === "#" || props.href === "") {
      throw new Error('Button: href="#" is forbidden. Give it a real destination or render a <button>.');
    }
    const { href, target, rel } = props;
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} target={target} rel={rel} className={classes}>
        {children}
      </a>
    );
  }

  const { type = "button", disabled, onClick } = props;
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
