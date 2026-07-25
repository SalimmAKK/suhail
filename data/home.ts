/* Landing page copy.

   CLAUDE.md section 7: sections take content as typed props from data/, so no
   copy is hardcoded in a section component. */

export type Cta = { label: string; href: string };

export type HeroContent = {
  eyebrow: string;
  /** one string per visual line, for LineReveal */
  headingLines: string[];
  sub: string;
  primary: Cta;
  secondary: Cta;
};

export const HERO: HeroContent = {
  eyebrow: "Tonight over AlUla",
  headingLines: ["Look up.", "Then book."],
  sub: "Four DarkSky-certified reserves sit north of AlUla, across one of the largest connected dark-sky parks in the world. We show what the sky will be doing on the night of your trip, then book the night that matches.",
  primary: { label: "Pick a night", href: "/tonight" },
  secondary: { label: "See the sites", href: "/sites" },
};

export const NIGHT_PICKER: { eyebrow: string; headingLines: string[]; sub: string } = {
  eyebrow: "Pick a night",
  headingLines: ["The sky is different", "every night you are here."],
  sub: "A full moon washes out everything faint. A new moon puts the Milky Way over the rocks. Choose a date to see which one your trip lands on.",
};
