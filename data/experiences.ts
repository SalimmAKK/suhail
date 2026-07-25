/* Seed operators and experiences.

   CLAUDE.md rule 12 is the binding constraint: never invent an operator, a
   product or a price. Every experience below is a real, currently listed
   product from a real Saudi operator, with the price as published.

   BUILD_PLAN stage 3 asks for six experiences across four sites and three
   operators. Three are here, across two sites and two operators, because
   that is what public listings actually support:

   - AlUla Manara's observatory is still being built, so there is nothing
     bookable there and inventing something would be a fabricated product.
   - Wadi Nakhlah was certified only recently and has no commercial dark-sky
     operator listing yet.
   - A third operator with a listed, priced dark-sky product in AlUla was
     not found. Banyan Tree AlUla publishes a stargazing guide, not a
     bookable priced experience.

   Add more by sourcing them, not by filling the gap. Each record carries the
   URL its figures came from.

   Prices are per person in SAR, inclusive of VAT where the listing says so.
   Sourced July 2026 and worth re-checking before the demo, since operators
   reprice seasonally. */

export type Operator = {
  slug: string;
  name: string;
  contactEmail: string | null;
  approved: boolean;
  verify: string[];
};

export type Experience = {
  slug: string;
  operatorSlug: string;
  siteSlug: string;
  title: string;
  description: string;
  durationMin: number;
  priceSar: number;
  groupMin: number;
  groupMax: number | null;
  /** true when the product only makes sense on a dark, new-moon-adjacent night */
  requiresDark: boolean;
  active: boolean;
  /** where the figures came from */
  source: string;
  verify: string[];
};

export const OPERATORS: Operator[] = [
  {
    slug: "husaak",
    name: "Husaak Adventures",
    contactEmail: null,
    approved: true,
    verify: ["Contact email not listed publicly. Seeded null rather than guessed."],
  },
  {
    slug: "pangaea",
    name: "Pangaea Adventures",
    contactEmail: null,
    approved: true,
    verify: ["Contact email not listed publicly. Seeded null rather than guessed."],
  },
];

export const EXPERIENCES: Experience[] = [
  {
    slug: "stargazing-at-gharameel",
    operatorSlug: "husaak",
    siteSlug: "algharameel",
    title: "Stargazing at Gharameel",
    description:
      "Driven out by 4x4 to the rock fins, guided in English or Arabic, with dinner over a fire. Runs as a stargazing night or a moonlit landscape night depending on where the moon is.",
    durationMin: 210,
    priceSar: 397,
    groupMin: 4,
    groupMax: null,
    requiresDark: true,
    active: true,
    source: "https://www.experiencealula.com/en/things-to-do/experiences/stargazing-at-gharameel",
    verify: [
      "Listing gives 3 to 4 hours. Seeded at 210 minutes, the midpoint.",
      "Maximum group size not published.",
      "SAR 397 is the adult price. Children are listed at SAR 340.",
    ],
  },
  {
    slug: "stargazing-at-sharaan",
    operatorSlug: "pangaea",
    siteSlug: "sharaan",
    title: "Stargazing at Sharaan",
    description:
      "A guided night inside the canyon, where the walls block what little glow reaches the reserve from the north. Snacks, water, and transport from the Pangaea Adventure Club.",
    durationMin: 140,
    priceSar: 350,
    groupMin: 2,
    groupMax: null,
    requiresDark: true,
    active: true,
    source: "https://www.experiencealula.com/en/things-to-do/experiences/stargazing-at-sharaan",
    verify: [
      "Listed as from SAR 350. The floor price, not a fixed one.",
      "Maximum group size not published.",
    ],
  },
  {
    slug: "sharaan-safari",
    operatorSlug: "pangaea",
    siteSlug: "sharaan",
    title: "Sharaan Safari",
    description:
      "Daylight run through the reserve in a private 4x4, for the trip that arrives before dark. Useful as the daytime half of a night at Sharaan rather than an alternative to it.",
    durationMin: 180,
    priceSar: 288,
    groupMin: 1,
    groupMax: 4,
    requiresDark: false,
    active: true,
    source: "https://www.experiencealula.com/en/things-to-do/experiences/pangaea-sharaan-safari",
    verify: [
      "Listed as from SAR 288. The floor price, not a fixed one.",
      "Group max of 4 is taken from the vehicle capacity quoted for hotel transfers, not from a stated limit.",
      "Minimum group size not published. Seeded at 1.",
    ],
  },
];

export const experienceBySlug = (slug: string): Experience | undefined =>
  EXPERIENCES.find((e) => e.slug === slug);

export const experiencesAtSite = (siteSlug: string): Experience[] =>
  EXPERIENCES.filter((e) => e.active && e.siteSlug === siteSlug);

export const operatorBySlug = (slug: string): Operator | undefined =>
  OPERATORS.find((o) => o.slug === slug);
