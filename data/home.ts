/* Landing page copy.

   CLAUDE.md section 7: sections take content as typed props from data/, so no
   copy is hardcoded in a section component. */

export type Cta = { label: string; href: string };

/* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo
 *
 * One Unsplash-licensed image per seeded experience, keyed by slug. All three
 * are real desert-night stock and none of them show AlUla or the site the
 * card names, which is why every card prints "PLACEHOLDER IMAGE, NOT <SITE>"
 * over the picture. Rule 13 allows licensed stock; rule 12 is why it says so
 * out loud instead of letting a photo imply a place.
 */
export const EXPERIENCE_IMAGES: Record<string, { src: string; alt: string }> = {
  "stargazing-at-gharameel": {
    src: "https://images.unsplash.com/photo-1581610186406-5f6e9f9edbc1?w=1200&q=75&auto=format&fit=crop",
    alt: "Sand dunes under a dense starfield. Stock photography from Abu Dhabi, not AlUla.",
  },
  "stargazing-at-sharaan": {
    src: "https://images.unsplash.com/photo-1489493173507-6feea31f12ff?w=1200&q=75&auto=format&fit=crop",
    alt: "Desert dunes at night under stars. Stock photography from Morocco, not AlUla.",
  },
  "sharaan-safari": {
    src: "https://images.unsplash.com/photo-1507917570388-d661984ea008?w=1200&q=75&auto=format&fit=crop",
    alt: "The Milky Way over sand dunes. Stock photography from China, not AlUla.",
  },
};

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

/* The homepage opens on inventory now, so it needs a header line rather than
   a hero: one eyebrow, one headline, and a stats line built from real counts
   at render time. */
export const HOME_HEADER = {
  eyebrow: "Tonight over AlUla",
  headline: "The sky is open over AlUla.",
  sub: "Every experience running on the night you pick, at four DarkSky-certified reserves north of AlUla.",
};

export const NIGHT_PICKER: { eyebrow: string; headingLines: string[]; sub: string } = {
  eyebrow: "Pick a night",
  /* Short lines on purpose: the chart now shares this row, so the copy
     column is narrower than it was and a long line wraps inside LineReveal's
     per-line mask, which reveals it as one block rather than line by line. */
  headingLines: ["A different sky", "every night."],
  sub: "A full moon washes out everything faint. A new moon puts the Milky Way over the rocks. Choose a date to see which one your trip lands on.",
};
