/* Landing page copy.

   CLAUDE.md section 7: sections take content as typed props from data/, so no
   copy is hardcoded in a section component. */

export type Cta = { label: string; href: string };

export type HeroImage = {
  src: string;
  /** what the picture actually shows, not what we wish it showed */
  alt: string;
  /** rendered on the image, so nobody mistakes stock for a Suhail site */
  caption: string;
};

export type HeroContent = {
  eyebrow: string;
  /** one string per visual line, for LineReveal */
  headingLines: string[];
  sub: string;
  primary: Cta;
  secondary: Cta;
  image: HeroImage;
};

export const HERO: HeroContent = {
  eyebrow: "Tonight over AlUla",
  headingLines: ["Look up.", "Then book."],
  sub: "Four DarkSky-certified reserves sit north of AlUla, across one of the largest connected dark-sky parks in the world. We show what the sky will be doing on the night of your trip, then book the night that matches.",
  primary: { label: "Pick a night", href: "/tonight" },
  secondary: { label: "See the sites", href: "/sites" },
  // PLACEHOLDER — replace with real, sourced AlUla/site photography before demo
  //
  // Unsplash-licensed stock, which clears rule 13's "real astrophotography,
  // licensed stock, or nothing" bar. It is not AlUla and is not any of the
  // four sites, so the alt text and the on-image caption both say so rather
  // than letting it read as a photograph of somewhere Suhail sends people.
  //
  // Dunes under the Milky Way, shot at Mingsha Mountain in China. The brief
  // suggested a snowy alpine peak, which is honestly generic but a poor
  // stand-in for a Saudi desert product even when labelled. This at least
  // shares its terrain with the real thing.
  image: {
    src: "https://images.unsplash.com/photo-1507917570388-d661984ea008?w=1600&q=80&auto=format&fit=crop",
    alt: "The Milky Way over sand dunes at night. Stock photography of a desert in China, not AlUla.",
    caption: "Placeholder image, not AlUla",
  },
};

export const NIGHT_PICKER: { eyebrow: string; headingLines: string[]; sub: string } = {
  eyebrow: "Pick a night",
  /* Short lines on purpose: the chart now shares this row, so the copy
     column is narrower than it was and a long line wraps inside LineReveal's
     per-line mask, which reveals it as one block rather than line by line. */
  headingLines: ["A different sky", "every night."],
  sub: "A full moon washes out everything faint. A new moon puts the Milky Way over the rocks. Choose a date to see which one your trip lands on.",
};
