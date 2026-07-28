/* Card copy for the catalogue views.

   CLAUDE.md section 7: sections take content as typed props from data/, so no
   copy is hardcoded in a section component. */

/* PLACEHOLDER — replace with real, sourced AlUla/site photography before demo
 *
 * One Unsplash-licensed image per seeded experience, keyed by slug. Every one
 * is real desert or night-sky stock and none of them show AlUla or the site
 * the card names, which is why each card carries a "stock, not <site>" tag
 * over the picture. Rule 13 allows licensed stock; rule 12 is why it says so
 * out loud instead of letting a photo imply a place.
 *
 * Each id was checked to resolve before it was added here. A 404 on this map
 * is a card with a grey hole in it, and the failure is silent.
 */
const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=1200&q=75&auto=format&fit=crop`;

export const EXPERIENCE_IMAGES: Record<string, { src: string; alt: string }> = {
  /* real records */
  "stargazing-at-gharameel": {
    src: UNSPLASH("photo-1581610186406-5f6e9f9edbc1"),
    alt: "Sand dunes under a dense starfield. Stock photography, not AlUla.",
  },
  "stargazing-at-sharaan": {
    src: UNSPLASH("photo-1489493173507-6feea31f12ff"),
    alt: "Desert dunes at night under stars. Stock photography, not AlUla.",
  },
  "sharaan-safari": {
    src: UNSPLASH("photo-1507917570388-d661984ea008"),
    alt: "The Milky Way over sand dunes. Stock photography, not AlUla.",
  },

  /* AlGharameel */
  "gharameel-milky-way-photography": {
    src: UNSPLASH("photo-1582209540198-6bfd137a9e57"),
    alt: "A rock formation silhouetted against a night sky. Stock photography, not AlUla.",
  },
  "gharameel-family-first-stars": {
    src: UNSPLASH("photo-1527419105721-af1f23c86dec"),
    alt: "Beds laid out in the open under a starry sky. Stock photography, not AlUla.",
  },
  "gharameel-new-moon-camp": {
    src: UNSPLASH("photo-1638862925201-4e373cb6a630"),
    alt: "A lit tent under the Milky Way. Stock photography, not AlUla.",
  },
  "gharameel-meteor-watch": {
    src: UNSPLASH("photo-1608408908478-fe36acb430ef"),
    alt: "People silhouetted on a rock formation under a starry night. Stock photography, not AlUla.",
  },

  /* Sharaan */
  "sharaan-deep-sky-telescope": {
    src: UNSPLASH("photo-1548124771-9f2040b66df8"),
    alt: "A telescope on a hillside under a night sky. Stock photography, not AlUla.",
  },
  "sharaan-canyon-dinner": {
    src: UNSPLASH("photo-1559460589-59f8520042c8"),
    alt: "People sitting around a campfire at night. Stock photography, not AlUla.",
  },
  "sharaan-sunset-to-stars": {
    src: UNSPLASH("photo-1620029288530-4ff6a684e33d"),
    alt: "A rocky mountain under a starry night. Stock photography, not AlUla.",
  },
  "sharaan-private-astronomer": {
    src: UNSPLASH("photo-1554215774-059b0d9d49d5"),
    alt: "A person standing beside a telescope on a tripod. Stock photography, not AlUla.",
  },

  /* AlUla Manara */
  "manara-plateau-telescope": {
    src: UNSPLASH("photo-1566229581300-2ce436d28538"),
    alt: "A telescope mounted outdoors. Stock photography, not AlUla.",
  },
  "manara-astrophotography-workshop": {
    src: UNSPLASH("photo-1717228359912-e2f6401df18f"),
    alt: "A telescope on a tripod in a field under the night sky. Stock photography, not AlUla.",
  },
  "manara-zodiacal-dawn": {
    src: UNSPLASH("photo-1501862700950-18382cd41497"),
    alt: "A mountain under a starry sky before dawn. Stock photography, not AlUla.",
  },
  "manara-observatory-preview": {
    src: UNSPLASH("photo-1518577589972-ad2d4f44eae9"),
    alt: "An observatory dish on a mountain peak at night. Stock photography, not AlUla.",
  },

  /* Wadi Nakhlah */
  "nakhlah-naked-eye-walk": {
    src: UNSPLASH("photo-1509811659822-9d273a2030a3"),
    alt: "Mountains silhouetted against a starry night. Stock photography, not AlUla.",
  },
  "nakhlah-bedouin-night": {
    src: UNSPLASH("photo-1543693259-805446e1bcc3"),
    alt: "Three camels under a starry sky. Stock photography, not AlUla.",
  },
  "nakhlah-dark-sky-intro": {
    src: UNSPLASH("photo-1570053102088-42ec524512a4"),
    alt: "A desert landscape at night. Stock photography, not AlUla.",
  },
  "nakhlah-photography-basics": {
    src: UNSPLASH("photo-1632679326346-19b4031f7c5e"),
    alt: "A rock formation with stars behind it. Stock photography, not AlUla.",
  },
};

/* /discover opens on inventory rather than a hero: one eyebrow, one headline,
   and a stats line built from real counts at render time. The hero this
   replaced, and the night-picker intro copy that went with it, were removed
   with Hero.tsx and ExperienceBoard.tsx once nothing imported either. */
export const HOME_HEADER = {
  eyebrow: "Tonight over AlUla",
  headline: "The sky is open over AlUla.",
  sub: "Every experience running on the night you pick, at four DarkSky-certified reserves north of AlUla.",
};
