# Hero redesign brief

Scope: the landing page hero only. This is a deliberate, scoped revision to
Stage 4's output — not a new BUILD_PLAN stage, not a palette change, and not
adopted from the Claude Design mockup's visual system wholesale. Read this
brief in full before touching any files.

## What is changing

1. **Typography** — the display/heading and body fonts are being replaced.
   Mono stays as-is.
2. **Hero layout** — from the current text + bled star chart composition to
   a photo/split treatment: a real (placeholder, see below) image alongside
   the headline and copy, similar in spirit to a detail-page hero, not the
   current abstract-chart-only hero.

## What is NOT changing

- **Palette.** Desert Nocturne stays exactly as defined in CLAUDE.md §5 —
  cream, ink, gold, sand, muted. No colors from the Claude Design mockup
  (its orange/red accent, its grey background) are being adopted.
- **Every other page and component.** This brief is hero-only. Nav, night
  picker, star chart (as a component — it may still appear elsewhere, e.g.
  `/tonight`), site map, booking flow, and all their existing styling are
  untouched.
- **IBM Plex Mono.** Coordinate tags, tracked-caps labels, and all
  instrument-style data (the celestial coordinate motif) keep using Plex
  Mono. It was not flagged as needing to change and does real signaling
  work in the current system — don't touch it.

## Typography

Replace:
- `Bricolage Grotesque` (display/headings) → **`Newsreader`**
- `IBM Plex Sans` (body/UI) → **`Public Sans`**

Both are Google Fonts, loadable via `next/font/google` exactly like the
current setup — this is a swap of the font family references, not a change
to the loading mechanism.

Rationale for the record: Newsreader is a text serif designed for long-form,
periodical-style reading — it fits Suhail's existing "almanac / star-catalog
register" identity (folio numbers, coordinate tags, the Vol. 01–04 document
system) better than a geometric grotesk. Public Sans is a clean, humanist
body face that won't compete with it.

**Scale and weight:** keep the existing type scale (`text-hero`, `text-pull`,
`text-label` etc. from `globals.css`) — only the `font-family` changes.
Newsreader supports an italic that should be used for the same accent-word
convention already established (the single italic-gold word per headline,
e.g. "Then *book.*") — don't invent a new emphasis convention, reuse the
existing one with the new typeface.

Verify rendering at the actual hero scale before considering this done —
Newsreader's letterforms are more delicate than Bricolage Grotesque's; check
that the headline doesn't read as thin or low-contrast against cream at
`clamp(48px, 6vw, 84px)`. Adjust weight (Newsreader ships multiple weights)
if needed, don't just accept the default.

## Hero layout

Restructure from the current arrangement (text column + bled star chart) to
a photo/split composition:
- One side: headline (LineReveal as before), sub-copy, primary + secondary
  CTA, eyebrow — content unchanged from current copy
- Other side: a real image, not the star chart

The star chart is not being removed from the product — it's Suhail's
signature element per CLAUDE.md §8.1. It's being removed from **this
specific hero composition** in favor of a photo. If there's a natural place
to still feature it on the landing page (e.g. a section below the hero,
teasing `/tonight`), propose that rather than dropping it from the landing
page entirely — check with the user before deciding either way, don't
silently drop Suhail's centerpiece element from the homepage.

## Placeholder photography

The Claude Design mockup used hotlinked Unsplash images (e.g.
`images.unsplash.com/photo-1519681393784-d120267933ba`), not bundled local
files. These are real Unsplash-licensed stock, which satisfies CLAUDE.md
§2.3/13's "real astrophotography, licensed stock, or nothing" bar as an
interim placeholder — but they are generic mountain/night-sky stock, not
verified to actually depict AlUla or any of Suhail's four real sites.

Use Unsplash-hosted images as placeholders for now:
- Configure `next.config.ts` to allow `images.unsplash.com` as a remote
  image pattern for `next/image`
- Pick images whose subject matter is honestly generic (night sky,
  desert/mountain terrain) — do not caption or label a placeholder image as
  if it depicts a specific real Suhail site (e.g. don't caption a generic
  photo "Sharaan Ridge" — that would misrepresent a real named place)
- Add a visible code comment at each placeholder image usage:
  `// PLACEHOLDER — replace with real, sourced AlUla/site photography before demo`
  so it's easy to find and swap later, and so it doesn't get mistaken for
  finished content in a later stage's review

## What to verify before calling this done

- `next build` clean
- Hero renders correctly at mobile, tablet, and desktop breakpoints — a
  photo/split layout has real responsive risk that the old text+chart hero
  didn't (image needs a sensible mobile treatment, likely stacked above or
  below the text column, not squeezed side by side)
- Newsreader/Public Sans render correctly (check network tab for the actual
  font files loading, not a fallback)
- No layout shift introduced (this was a hard requirement for the original
  hero — don't regress it for the new one)
- Screenshot the result at at least two breakpoints before considering this
  finished — screenshots have caught real bugs at every stage so far, this
  is not an exception
