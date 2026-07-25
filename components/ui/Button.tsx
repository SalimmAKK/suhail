import Link from "next/link";
import { cn, focusRing } from "@/lib/cn";

/* CLAUDE.md section 5: three variants, no outline and no ghost. `primary` is
   ink and carries most navigation. `accent` is gold and is used once per page
   for the real CTA. `light` is the same gold sitting on a dark section. */
type Variant = "primary" | "accent" | "light";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-deep",
  accent: "bg-gold text-paper hover:bg-gold-deep",
  light: "bg-gold text-paper hover:bg-gold-deep",
};

const SIZES: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

type AnchorProps = CommonProps & {
  href: string;
  target?: string;
  rel?: string;
};

type NativeProps = CommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Button(props: AnchorProps | NativeProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ease-move",
    focusRing,
    "disabled:cursor-not-allowed disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
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
