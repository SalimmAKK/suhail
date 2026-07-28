/* Operators and experiences.
 *
 * READ THIS BEFORE ADDING A RECORD.
 *
 * This file holds two kinds of record and they are not interchangeable.
 *
 *   fictional: false  Real, currently listed products from real Saudi
 *                     operators, priced as published, each carrying the URL
 *                     its figures came from. CLAUDE.md rule 12 governs these
 *                     absolutely: never add one without a source.
 *
 *   fictional: true   Demo inventory written for the Ravyn bootcamp
 *                     prototype, at the project owner's explicit direction,
 *                     to populate the discovery and search views with enough
 *                     variety to actually exercise them. The operators do not
 *                     exist. The prices are invented. None of it is bookable.
 *
 * The split exists so the fabrication stays legible. A grader, a partner, or
 * whoever picks this up next can filter on one boolean and see exactly which
 * three records are real. The UI carries the flag through as well, rather
 * than letting seeded demo rows pass as sourced inventory.
 *
 * To take this to production: delete every fictional record, or source it.
 * Do not quietly flip the flag.
 *
 * Two names from the design mock are deliberately absent. The Royal
 * Commission for AlUla and Experience AlUla are real bodies, and listing them
 * as vendors would imply an endorsement that does not exist. CLAUDE.md rule
 * 14 keeps them as context only.
 *
 * Prices are per person in SAR. The real ones were sourced July 2026 and are
 * worth re-checking before the demo, since operators reprice seasonally.
 */

export type Operator = {
  slug: string;
  name: string;
  contactEmail: string | null;
  approved: boolean;
  /** invented for the prototype. see the header. */
  fictional: boolean;
  verify: string[];
};

/** What kind of night this is. Drives the category chips and the tag on each
    card, and is the one axis of variety a price filter cannot express. */
export type ExperienceCategory =
  | "stargazing"
  | "astrophotography"
  | "telescope"
  | "overnight"
  | "family"
  | "dinner"
  | "hike"
  | "private";

export const CATEGORY_LABEL: Record<ExperienceCategory, string> = {
  stargazing: "Stargazing",
  astrophotography: "Astrophotography",
  telescope: "Telescope",
  overnight: "Overnight",
  family: "Family",
  dinner: "Dinner",
  hike: "Walk",
  private: "Private",
};

export type Experience = {
  slug: string;
  operatorSlug: string;
  siteSlug: string;
  title: string;
  description: string;
  category: ExperienceCategory;
  durationMin: number;
  priceSar: number;
  groupMin: number;
  groupMax: number | null;
  /** true when the product only makes sense on a dark, new-moon-adjacent night */
  requiresDark: boolean;
  active: boolean;
  /** invented for the prototype. see the header. */
  fictional: boolean;
  /** where the figures came from. null for fictional records. */
  source: string | null;
  verify: string[];
};

export const OPERATORS: Operator[] = [
  /* ------------------------------------------------------------------ real */
  {
    slug: "husaak",
    name: "Husaak Adventures",
    contactEmail: null,
    approved: true,
    fictional: false,
    verify: ["Contact email not listed publicly. Seeded null rather than guessed."],
  },
  {
    slug: "pangaea",
    name: "Pangaea Adventures",
    contactEmail: null,
    approved: true,
    fictional: false,
    verify: ["Contact email not listed publicly. Seeded null rather than guessed."],
  },

  /* ------------------------------------------------------------- fictional */
  {
    slug: "sirius-expeditions",
    name: "Sirius Expeditions",
    contactEmail: "night@sirius-expeditions.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype. Name taken from the design handoff's mock data."],
  },
  {
    slug: "black-basalt",
    name: "Black Basalt Tours",
    contactEmail: "hello@blackbasalt.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype. Name taken from the design handoff's mock data."],
  },
  {
    slug: "hegra-night-collective",
    name: "Hegra Night Collective",
    contactEmail: "book@hegranight.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype."],
  },
  {
    slug: "northern-hejaz-astronomy",
    name: "Northern Hejaz Astronomy Club",
    contactEmail: "outreach@nhac.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype."],
  },
  {
    slug: "qamar-desert-camp",
    name: "Qamar Desert Camp",
    contactEmail: "stay@qamarcamp.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype. Qamar is the Arabic for moon."],
  },
  {
    slug: "rimal-outfitters",
    name: "Rimal Outfitters",
    contactEmail: "trips@rimal.example",
    approved: true,
    fictional: true,
    verify: ["Invented for the prototype. Rimal is the Arabic for sands."],
  },
];

export const EXPERIENCES: Experience[] = [
  /* ------------------------------------------------------------------ real
     Three products, two operators, two sites. This is what public listings
     actually supported when the catalogue was sourced. AlUla Manara has no
     real bookable product because the observatory is still being built, and
     Wadi Nakhlah had no commercial dark-sky operator listing. */
  {
    slug: "stargazing-at-gharameel",
    operatorSlug: "husaak",
    siteSlug: "algharameel",
    title: "Stargazing at Gharameel",
    description:
      "Driven out by 4x4 to the rock fins, guided in English or Arabic, with dinner over a fire. Runs as a stargazing night or a moonlit landscape night depending on where the moon is.",
    category: "stargazing",
    durationMin: 210,
    priceSar: 397,
    groupMin: 4,
    groupMax: null,
    requiresDark: true,
    active: true,
    fictional: false,
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
    category: "stargazing",
    durationMin: 140,
    priceSar: 350,
    groupMin: 2,
    groupMax: null,
    requiresDark: true,
    active: true,
    fictional: false,
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
    category: "private",
    durationMin: 180,
    priceSar: 288,
    groupMin: 1,
    groupMax: 4,
    requiresDark: false,
    active: true,
    fictional: false,
    source: "https://www.experiencealula.com/en/things-to-do/experiences/pangaea-sharaan-safari",
    verify: [
      "Listed as from SAR 288. The floor price, not a fixed one.",
      "Group max of 4 is taken from the vehicle capacity quoted for hotel transfers, not from a stated limit.",
      "Minimum group size not published. Seeded at 1.",
    ],
  },

  /* ------------------------------------------------- fictional: AlGharameel
     The fins give the sky a foreground, so the invented inventory here leans
     photographic and naked-eye. */
  {
    slug: "gharameel-milky-way-photography",
    operatorSlug: "sirius-expeditions",
    siteSlug: "algharameel",
    title: "Milky Way photography at the fins",
    description:
      "Five hours working the sandstone fins as foreground while the galactic core swings overhead. Tripods and intervalometers provided, editing walkthrough on the drive back.",
    category: "astrophotography",
    durationMin: 300,
    priceSar: 890,
    groupMin: 2,
    groupMax: 8,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "gharameel-family-first-stars",
    operatorSlug: "qamar-desert-camp",
    siteSlug: "algharameel",
    title: "First stars, family night",
    description:
      "Two hours built for children: bedrolls laid out facing east, a guide naming the bright ones, hot chocolate, and everyone back before it gets late. Runs whatever the moon is doing.",
    category: "family",
    durationMin: 120,
    priceSar: 240,
    groupMin: 1,
    groupMax: 20,
    requiresDark: false,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "gharameel-new-moon-camp",
    operatorSlug: "rimal-outfitters",
    siteSlug: "algharameel",
    title: "Overnight camp under the new moon",
    description:
      "Sleep out among the fins on the darkest nights of the month. Tents, bedding and dinner included, sunrise over the reserve before the drive back into AlUla.",
    category: "overnight",
    durationMin: 720,
    priceSar: 1450,
    groupMin: 2,
    groupMax: 10,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "gharameel-meteor-watch",
    operatorSlug: "hegra-night-collective",
    siteSlug: "algharameel",
    title: "Meteor watch at the fins",
    description:
      "Four hours flat on your back on a shower peak, with nothing between you and the radiant. No telescope: meteors are a naked-eye event and a scope only narrows the sky.",
    category: "stargazing",
    durationMin: 240,
    priceSar: 320,
    groupMin: 1,
    groupMax: 24,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },

  /* ----------------------------------------------------- fictional: Sharaan
     The canyon walls cut the northern horizon, so the invented inventory
     leans southern-sky and deep-sky. */
  {
    slug: "sharaan-deep-sky-telescope",
    operatorSlug: "northern-hejaz-astronomy",
    siteSlug: "sharaan",
    title: "Deep sky through the sixteen-inch",
    description:
      "Globular clusters, planetary nebulae and the Sagittarius star clouds through a sixteen-inch Dobsonian, run by the club that maintains it. Bring your own eyepieces if you have them.",
    category: "telescope",
    durationMin: 210,
    priceSar: 540,
    groupMin: 2,
    groupMax: 12,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "sharaan-canyon-dinner",
    operatorSlug: "black-basalt",
    siteSlug: "sharaan",
    title: "Canyon dinner and the southern sky",
    description:
      "Dinner set on the canyon floor, then coffee while Scorpius and Sagittarius climb the gap in the southern wall. The food is the point as much as the sky is.",
    category: "dinner",
    durationMin: 240,
    priceSar: 680,
    groupMin: 2,
    groupMax: 14,
    requiresDark: false,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "sharaan-sunset-to-stars",
    operatorSlug: "pangaea",
    siteSlug: "sharaan",
    title: "Sunset ridge to star field",
    description:
      "Up on the ridge for last light, down into the reserve as the sky goes over. Five hours that covers both halves of the evening rather than making you choose between them.",
    category: "stargazing",
    durationMin: 300,
    priceSar: 520,
    groupMin: 2,
    groupMax: 8,
    requiresDark: false,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "sharaan-private-astronomer",
    operatorSlug: "sirius-expeditions",
    siteSlug: "sharaan",
    title: "A private night with an astronomer",
    description:
      "One group, one astronomer, three hours, and whatever you want to look at. Built for people who already know what they want to see and want someone who can find it.",
    category: "private",
    durationMin: 180,
    priceSar: 1250,
    groupMin: 1,
    groupMax: 4,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },

  /* ------------------------------------------------ fictional: AlUla Manara
     The highest and driest of the four. Nothing is genuinely bookable here
     until the observatory opens, so everything below is invented. */
  {
    slug: "manara-plateau-telescope",
    operatorSlug: "northern-hejaz-astronomy",
    siteSlug: "manara",
    title: "Plateau telescope night",
    description:
      "Twelve hundred metres up on the driest plateau in the region, where the seeing holds steady long after it has broken down in the wadi. Three hours, four instruments.",
    category: "telescope",
    durationMin: 180,
    priceSar: 620,
    groupMin: 2,
    groupMax: 16,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. The Manara observatory is still under construction."],
  },
  {
    slug: "manara-astrophotography-workshop",
    operatorSlug: "sirius-expeditions",
    siteSlug: "manara",
    title: "Astrophotography workshop",
    description:
      "Six hours of tracked exposure, stacking and calibration frames, run for six people at most. Assumes you own a camera and have never pointed it at anything this faint.",
    category: "astrophotography",
    durationMin: 360,
    priceSar: 1180,
    groupMin: 2,
    groupMax: 6,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "manara-zodiacal-dawn",
    operatorSlug: "rimal-outfitters",
    siteSlug: "manara",
    title: "Zodiacal light before dawn",
    description:
      "Out at three in the morning for the false dawn: a cone of sunlight scattered off interplanetary dust, visible from here in a way it simply is not from anywhere near a town.",
    category: "stargazing",
    durationMin: 240,
    priceSar: 460,
    groupMin: 2,
    groupMax: 10,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "manara-observatory-preview",
    operatorSlug: "hegra-night-collective",
    siteSlug: "manara",
    title: "Observatory site walk",
    description:
      "A daylight walk around the observatory site while it is still going up, with the people building it. The only way onto the plateau before the visitor centre opens.",
    category: "hike",
    durationMin: 150,
    priceSar: 210,
    groupMin: 2,
    groupMax: 18,
    requiresDark: false,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },

  /* ------------------------------------------------ fictional: Wadi Nakhlah
     The newest of the four and the least built on. Nothing here is real. */
  {
    slug: "nakhlah-naked-eye-walk",
    operatorSlug: "hegra-night-collective",
    siteSlug: "wadi-nakhlah",
    title: "Naked-eye walk into the wadi",
    description:
      "Two and a half hours on foot with no instruments at all, learning the sky the way it was navigated: by shape, by season, and by which star sits where at which hour.",
    category: "hike",
    durationMin: 150,
    priceSar: 260,
    groupMin: 2,
    groupMax: 16,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "nakhlah-bedouin-night",
    operatorSlug: "qamar-desert-camp",
    siteSlug: "wadi-nakhlah",
    title: "Bedouin night in the wadi",
    description:
      "Five hours around a fire with the families who have read this sky for navigation for generations. Dinner, qahwa, and the star names that came before the Latin ones.",
    category: "dinner",
    durationMin: 300,
    priceSar: 740,
    groupMin: 4,
    groupMax: 18,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "nakhlah-dark-sky-intro",
    operatorSlug: "black-basalt",
    siteSlug: "wadi-nakhlah",
    title: "Dark sky, first night",
    description:
      "Two hours and the cheapest way into the reserve. For the traveller who has never been under a Bortle 2 sky and wants to find out whether it is worth building an evening around.",
    category: "stargazing",
    durationMin: 120,
    priceSar: 180,
    groupMin: 1,
    groupMax: 24,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
  {
    slug: "nakhlah-photography-basics",
    operatorSlug: "black-basalt",
    siteSlug: "wadi-nakhlah",
    title: "Night photography, from scratch",
    description:
      "Three and a half hours on the basics: manual focus in the dark, the five-hundred rule, and getting one frame you would actually print. Phone or camera, both work here.",
    category: "astrophotography",
    durationMin: 210,
    priceSar: 420,
    groupMin: 2,
    groupMax: 8,
    requiresDark: true,
    active: true,
    fictional: true,
    source: null,
    verify: ["Invented for the prototype. Not a real product."],
  },
];

export const experienceBySlug = (slug: string): Experience | undefined =>
  EXPERIENCES.find((e) => e.slug === slug);

export const experiencesAtSite = (siteSlug: string): Experience[] =>
  EXPERIENCES.filter((e) => e.active && e.siteSlug === siteSlug);

/** The records that are actually sourced, for anywhere that must not show
    invented inventory. */
export const realExperiences = (): Experience[] => EXPERIENCES.filter((e) => !e.fictional);
