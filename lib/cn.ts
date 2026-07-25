export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* CLAUDE.md section 5 quality floor: attention, 2px, 3px offset, keyboard only */
export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-attention";
