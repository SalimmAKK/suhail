# CLAUDE.md / Suhail

Project constitution. Read this before writing any code. If a prompt conflicts
with a rule here, stop and flag it rather than quietly resolving it.

This project inherits its structural discipline, animation primitives, and
component conventions from EduImprovement Hub. The visual system is different —
warm desert nocturne, not cool pine — but the rules that made the edu-hub build
disciplined apply here without exception.

---

## 1. What this is

**Suhail is the discovery and booking layer for Saudi Arabia's dark-sky
experiences.** It surfaces what the sky is actually offering on a specific night
over AlUla and its surrounding Dark Sky Parks, and lets a traveller book the
matching experience in one flow.

Built as a bootcamp project (Ravyn Academy Summer 2026, Project 02) to a
functional demo, hosted at a public URL, pitched as if to an investor or
government partner. Not a live business. But every design and content decision
is made as if it is.

**Primary user:** international or GCC traveller planning a trip that includes
AlUla or Red Sea, astro-curious rather than astronomer, willing to shape one or
two evenings around sky conditions if the product makes it easy.

**Primary conversion goal:** complete a booking for a specific night at a
specific dark-sky site.

**Voice:** confident, place-specific, product-forward. First-person plural
where appropriate ("we surface", "we book"), never in a corporate way. The
copy has room to be a little literary — this is the astrotourism category —
but never at the expense of clarity.

---

## 2. STRICT ANTI-SLOP RULES

Non-negotiable. Check output against this list before reporting any task complete.

### 2.1 Writing
1. **No em dashes.** Use a period or comma. Hyphens in compound words are fine.
2. **No emojis.** Not in copy, comments, or commits.
3. **No filler that states the obvious.** If a sentence would be equally true
   on Viator, delete it.
4. **No invented stats.** No fake user counts, no fake booking counters, no
   partner logo walls. We are pre-launch.
5. **No repeated content blocks reused verbatim across pages.**
6. **The star Suhail is a real cultural referent, use it once well.** Reference
   the celestial navigation heritage in the hero or the about section, not in
   every paragraph. Overuse cheapens it.

### 2.2 Components
7. **No decorative icon rows.** An icon labels a distinct thing. It does not
   fill space. Cut it if removing it loses no information.
8. **No placeholder links.** Every href functions or is explicitly labelled
   `non functional in prototype`. No `href="#"`.
9. **No decorative surfaces that carry no meaning.** Glassmorphism, blur,
   subtle gradients, and ambient elements are allowed where they earn their
   place — the nav bar (glass), the hero (ambient stars) — and are banned
   everywhere else. The distinction: a device is fine when it expresses
   something specific to Suhail (the sky, depth, night). It is not fine as
   generic 2020s visual furniture applied to every card and section. If it
   would look at home on a fintech landing page, cut it.
10. **No element exists to look impressive.** If you cannot say what a
    component does for a traveller in one sentence, cut it. Fun and personality
    are welcome; decoration for its own sake is not. The test: could you
    defend this element to a grader who asked "why is that there?"
11. **No dashboard framing anywhere on public-facing pages.** No sidebar, no
    left-nav app shell, no dense KPI grids. This is a booking product, not a
    SaaS product. The temptation to reach for the dashboard pattern is the
    whole reason we chose a different interaction model — resist it.

### 2.3 Content integrity
12. **Never invent a fact.** No fake operator names, no fake reviews, no fake
    tour prices. Use `[VERIFY: description]` and leave it visible on the page.
    Real seed data ties to real Saudi operators (Pangaea Adventures, Husaak,
    etc.) sourced from public listings, priced from public retail figures.
13. **Never use AI-generated imagery for astro or place photography.** Real
    astrophotography, licensed stock, or nothing. AlUla itself is well
    photographed by the RCU under permissive terms — start there.
14. **No fake trust badges.** RCU, Experience AlUla, and Vision 2030 are
    context. They are not endorsements of this product. Text only, never their
    logos.
15. **The v1 booking flow is a mock.** Mada / Stripe live mode is out of scope.
    Booking ends in a mock confirmation with a real database row. Do not fake
    a payment success — label the payment step clearly as `demo mode` when
    it appears.

### 2.4 The platform reality rule
16. **The product is being demoed, not sold.** No "sign up", no "trusted by",
    no fake tour counts. Allowed: "book this night", "see the sky", "reserve".
    Forbidden: any claim implying a running two-sided marketplace.
17. **Operators are seeded manually in v1.** No operator self-service portal.
    An `/operators` admin route may exist for demo purposes but is not linked
    from the public nav.

---

## 3. Stack

- **Next.js App Router, TypeScript, Tailwind.** Same as edu-hub.
- **Not fully static.** Suhail needs client interactivity for the star chart,
  night picker, and Mapbox map. Use App Router with `'use client'` on
  interactive leaves. Server components render the shell.
- **Supabase (Postgres) for persistence.** Not Firestore. The whole schema
  (operators → experiences → availability windows → bookings) is relational
  and the architecture doc showcases the schema. Set up via the JS client,
  never expose the service role key to the browser.
- **Mapbox GL JS** for the site picker map. Not Google Maps. Mapbox's free
  tier covers demo traffic and the styling is more design-controllable.
  Use a custom `light-v11`-derived style tuned to the palette.
- **PWA:** `next-pwa` for service worker generation, plus a custom offline
  cache for the last-viewed experience/booking. Full offline mode is a hard
  requirement (traveller may lose signal in the desert on their trip).
- **Deployment:** Vercel. Not Cloudflare Pages this time — Vercel's Next.js
  runtime supports the API routes and image handling Suhail needs.
- **Fonts:** same three as edu-hub, `Bricolage Grotesque` / `IBM Plex Sans` /
  `IBM Plex Mono`, loaded via `next/font/google`. The system already works;
  do not reintroduce a font decision.
- **Icons:** `lucide-react`, subject to §2.2 rule 7.
- **Animation orchestration:** Framer Motion for choreographed sequences (the
  launch intro, the night picker reveal). Keep the `Reveal` and `LineReveal`
  primitives from edu-hub as the base — Framer Motion is for the two or three
  places where they are insufficient, not a wholesale replacement.
- **Smooth scroll:** Lenis, wired at the layout level. Every anchor and
  scroll-triggered element assumes it.

### Known traps

- Mapbox's default token exposure: use the public token in the client, never
  put a secret token in `NEXT_PUBLIC_*`. The public token is scoped by
  referrer URL restrictions in the Mapbox dashboard.
- Supabase RLS: enable row-level security from the first table. It is easier
  to write policies as you go than to retrofit.
- Next PWA + App Router: `next-pwa` needs the App Router configuration path.
  The service worker registers via a `'use client'` component in the layout,
  not via `next.config.js` alone.
- Framer Motion + SSR: any component using `motion.*` needs `'use client'`.

---

## 4. Routes

```
/                          Landing. Hero, star chart teaser, the night picker,
                           three signature dark-sky sites, credibility strip.
/tonight                   The night picker as its own full page. Same
                           component as on the landing, expanded.
/sites                     The four Dark Sky sites as a map + list view.
/sites/[slug]              A single site's page. Sky, timing, experiences
                           available there.
/book/[experienceId]       The booking flow. Date, guests, contact, mock pay.
/book/confirmation/[id]    Confirmation screen. Real DB row, real reference.
/about                     What Suhail is, why now, the founder note.
/operators                 Admin route. Seeded operators + bookings received.
                           Not linked from public nav.
```

Bottom nav on mobile has exactly **three** icons:
`Sky` (star chart) · `Sites` (map) · `Trips` (bookings). No more, no less.
Rule 2.2/7 applies — each is a distinct destination, not decoration.

---

## 5. Design language

### The idea
**The sky is the design language.** This product exists because the sky over
AlUla is exceptional and no one is treating it as bookable inventory. Colour,
motion, and typography express that one idea. Everything memorable comes from
taking it seriously and expressing it consistently, rather than importing
generic booking-site conventions.

Where edu-hub's design language was "the rubric," Suhail's is "the almanac" —
the star catalog, the celestial ephemeris, the archival feel of a document
recording what the sky is doing tonight.

### Tokens

```css
:root {
  --cream:     #FAF8F3;   /* page background. warm paper, not white */
  --paper:     #FFFFFF;   /* card backgrounds */
  --sand:      #E8DFC9;   /* tint for grouped sections */
  --ink:       #1A1D2E;   /* text, and full dark sections (night sky) */
  --ink-deep:  #0F1220;   /* primary hover, deepest night */
  --gold:      #C9A961;   /* primary accent, brass. one accent per composition */
  --gold-deep: #A8894A;   /* accent hover */
  --muted:     #6B6B6B;   /* secondary text */
  --line:      #E4DFD4;   /* hairlines */
  --moon:      #F5F0E1;   /* highlight on dark backgrounds. warm bone */

  /* the sky-quality ramp — used to indicate moon phase and dark-sky bortle
     scale on dark backgrounds. NOT decorative colour, always semantic. */
  --sky-1:     #2A2E45;   /* full moon / bright sky, worst for stargazing */
  --sky-2:     #3D416A;   /* gibbous */
  --sky-3:     #4A5285;   /* half moon */
  --sky-4:     #5B67A5;   /* crescent */
  --sky-5:     #A8B5D1;   /* new moon / darkest, best for stargazing */

  /* semantic. band-2 in edu-hub was orange for attention. keep the same
     convention with a warmer gold. */
  --attention: #E8A33D;   /* form errors, focus rings */
  --danger:    #C45A4A;   /* destructive actions only */

  --ease:      cubic-bezier(.22,.61,.36,1);
}
```

**No colour outside this list.** No purple, indigo, or teal. The palette is
warmer than edu-hub deliberately: this is Saudi at night, not a Nordic
consultancy.

### Type
Inherit exactly from edu-hub:
- **Display** (h1, h2, h3): `Bricolage Grotesque`, 400/500/600,
  `letter-spacing: -0.03em`, `line-height: 1.05`
- **Body and UI:** `IBM Plex Sans`, 400/500/600
- **Labels, eyebrows, coordinates, folio numbers:** `IBM Plex Mono`, 11px,
  uppercase, `letter-spacing: 0.1em`

**Scale with conviction.** Hero h1 is `clamp(48px, 6vw, 84px)` — bigger than
edu-hub because the astrotourism category tolerates and rewards it. Section
pull-headings `clamp(38px, 4.6vw, 62px)`. Body 17px. Mono labels stay 11px.

### Section rhythm
Alternate cream and ink. A page that is all cream reads flat. Ink sections
are where the star chart and sky-ramp actually sing. Roughly: hero (cream),
night picker (ink, this is the moment), sites (cream), booking preview (ink),
credibility (cream), footer (ink).

### Structural devices
- **The coordinate tag.** Mono row like `26.85°N · ALULA · 692M · BORTLE 2`.
  Used under section headings and site names. Data as ornament.
- **The glass nav.** The desktop and mobile navs are floating pills, not
  bars: `fixed`, inset 16px from the top and sides (24px at `md`),
  `rounded-full`, hairline border in `line`, and a soft shadow lifting them
  off the page. Frosted glass — `backdrop-blur-md` over a warm-cream 70%
  translucent base on light sections, and an ink 50% translucent base on
  dark sections. This is the one glass surface in the product — every other
  component is opaque. The glass says "the sky is behind everything on this
  page" without being a full-screen effect.

  The pill must be `fixed`, never `sticky`. Sticky reserves its own space in
  the flow, so nothing ever passes beneath it, `backdrop-blur` has nothing to
  blur, and the glass degrades to a flat opaque bar.

  Because it is out of the flow, **a section's background runs to the top of
  the page and the section pads its own content down by `--nav-clearance`**
  (globals.css). Never put top padding on `<main>` — that pushes the
  backgrounds down too and empties the glass. Full-ink sections carry
  `data-nav-tone="ink"` so the pill re-tones over them (`lib/useNavTone.ts`).
- **The ambient starfield.** A very subtle, non-interactive layer of ~40 to
  60 tiny star points scattered across the hero and any full-ink section,
  rendered as a static SVG with a slow ambient drift (motion 8). Star sizes
  1 to 2 px, opacity 30 to 60%. It is atmosphere, not content — the visible
  star chart in §8.1 is a separate, legible, load-bearing element. The
  ambient layer never overlaps the star chart's viewBox. If you cannot tell
  it is there without looking for it, it is doing its job.
- **The star chart.** SVG-rendered constellations over AlUla for a given
  date. The signature centrepiece, see §8.
- **The moon phase indicator.** Small circular graphic showing tonight's
  moon. Present in the hero, the night picker, and each booking card.
- **The card.** Same as edu-hub's card treatment: white on cream, hairline
  border, 3px gold rule sweeping in on hover. Do not reinvent this.
- **The status pip.** Mono label plus one dot. `Prime night` (sky-5),
  `Ok night` (sky-3), `Bright night` (sky-1). Applied to date cells in the
  night picker.
- **The bleed.** The star chart on the hero sits past the right edge and is
  softly cropped. Asymmetry is deliberate.

### Buttons
Inherit edu-hub's three-variant system:
- `primary`: `ink` background, white text, `ink-deep` on hover
- `accent`: `gold` background, `ink` text, `gold-deep` on hover — used for
  the one primary CTA per page ("Book this night")
- `light`: `gold` background, `ink` text, on a dark section

The gold variants carry ink, not white. White on gold is roughly 2:1 and
fails AA on the one CTA that appears on every page. Ink on gold is roughly
7:1, and 5:1 against `gold-deep` on hover.

No outline buttons. No ghost buttons. If it needs to be tapped, it looks
tappable.

**Shape carries rank.** `Button` takes a `pill` prop, opt-in, never a global
default. The capsule is Suhail's signature action shape and marks the single
most important action on a surface:

- **Pill (`rounded-full`)** — the nav CTA, the hero CTA (`Pick a night`), the
  booking CTA (`Reserve`), the one action a confirmation screen offers. At
  most one per surface, matching the "one accent per composition" rule.
- **Default (`rounded-md`)** — everything else. Form submits, buttons inside
  cards, inline actions, secondary CTAs sitting beside a pill.

Do not reach for `pill` to make a button feel more important than the surface
warrants. If two buttons on a screen are both pills, one of them is wrong.
The shape is a hierarchy signal, not decoration, so §2.2 rule 10 applies:
if you cannot say which single action the pill is pointing at, it should be
`rounded-md`.

---

## 6. Motion

Clean, with a little flare, more than edu-hub allowed. This is a product
about the sky at night — the site should have some of that atmosphere.
Everything below respects `prefers-reduced-motion`. Everything renders
correct-by-default without JS.

### Easing and duration
```
--ease: cubic-bezier(.22,.61,.36,1)
colour, opacity: 150ms to 250ms
small movement (hover, arrow nudge): 200ms
star chart draw-in: 900ms, --ease
section reveals: 700ms, staggered 60-90ms
launch intro sequence: 1400ms total, one-time
```

### The permitted set
1. **Reveal** and **LineReveal** — same primitives as edu-hub, ported as-is.
   Reveal for section entries, LineReveal for display headings.
2. **Star draw.** Constellation lines draw in stroke-dashoffset style, star
   points fade in slightly after. 900ms, `--ease`. This is Suhail's answer to
   edu-hub's "band fill" — the core action made kinetic.
3. **Sky ramp cell fill.** In the night picker calendar, each date cell fills
   its sky-quality colour with a `scaleY` reveal from the bottom, 350ms.
4. **Launch intro.** Full-viewport intro on first visit only (sessionStorage
   flag). Ink backdrop, `Suhail` wordmark fades in one letter at a time over
   500ms, coordinate line under it fades in, 300ms hold, transition to
   landing. Reference: Ink Games' cinematic intros
   (https://inkgames.com — smooth-scroll wrapper, layered reveals).
   **Skip on repeat visits and when reduced-motion is set.**
5. **Smooth scroll.** Lenis at the root, gentle damping. Not scroll-jacking —
   just smoothed native scroll.
6. **Card lift.** Cards rise 4px, shadow deepens on hover, 200ms.
7. **Moon phase reveal.** The circular moon graphic in the hero draws its
   shadow with a `clip-path` transition on load, 800ms. Once.
8. **Ambient star drift.** The starfield backdrop drifts very slowly —
   individual stars twinkle their opacity between 30% and 60% on independent
   4 to 8 second cycles, with a global 60-second horizontal drift of no more
   than 8 pixels across the whole layer. Pauses under `prefers-reduced-motion`.
   Never distract from foreground content.
9. **Micro-delights, sparingly.** Small, considered flourishes are welcome
   where they reward attention. Examples that would fit: a tiny star icon
   in the primary CTA that twinkles once on hover; the moon phase graphic
   ticking to the next phase if the visitor scrubs a date; the confirmation
   number typing itself in with a slight jitter. **The rule: one micro-delight
   per key surface, not one per element.** Cursor-tracked effects, hover
   trails, and scroll-jacked reveals are still banned.

### Banned
No carousels. No counting numbers. No cursor-tracked 3D tilt. No page
transition wipes (the intro is the only exception, and it fires once).
No text scrambles. No parallax beyond the star chart's 24px scroll drift.
The ambient starfield is the only continuous background motion and it must
stay subtle — no shooting stars, no orbiting planets, no meteor showers.

---

## 7. Components

Ported as-is from edu-hub, no rework needed:
- `components/ui/Button.tsx`
- `components/ui/Card.tsx`
- `components/ui/Eyebrow.tsx`
- `components/ui/Field.tsx`
- `components/ui/Reveal.tsx`
- `components/ui/LineReveal.tsx`
- `components/layout/Shell.tsx`
- `components/layout/Footer.tsx`
- `lib/cn.ts`

Rename to Suhail context (no `BandChip`, no `BandScale`, no `StatusChip`, no
`ReportCard` — those belong to edu-hub). New Suhail-specific components:

```
components/
  layout/
    Nav.tsx              Top nav, desktop
    MobileNav.tsx        Bottom 3-icon nav, mobile only
    LaunchIntro.tsx      One-time cinematic intro
    SmoothScroll.tsx     Lenis wrapper
  ui/
    CoordinateTag.tsx    Mono coordinate/data strip
    MoonPhase.tsx        SVG moon phase indicator (takes lunation %)
    SkyPip.tsx           Status pip for date cells (Prime / Ok / Bright)
    Button.tsx           ported
    Card.tsx             ported
    Eyebrow.tsx          ported
    Reveal.tsx           ported
    LineReveal.tsx       ported
    Field.tsx            ported
  sections/
    Hero.tsx             Hero + star chart bleed
    StarChart.tsx        SVG constellation renderer
    NightPicker.tsx      Signature interactive centrepiece (§8)
    SiteMap.tsx          Mapbox with 4 dark-sky sites
    SiteDetail.tsx       Per-site page content
    ExperienceCard.tsx   Bookable experience tile
    BookingFlow.tsx      Date / guests / contact / mock pay
    Confirmation.tsx     Post-booking screen
    Credibility.tsx      RCU / Dark Sky Association / Vision 2030 context
    Founder.tsx          Single-founder note
  data/
    stars.ts             Curated visible-from-AlUla constellations
    sites.ts             Four dark-sky sites, coordinates, elevation
    experiences.ts       Seed experiences per site
  lib/
    astro.ts             Moon phase, sky quality per date at AlUla lat/long
    supabase.ts          Client factory
    booking.ts           createBooking(), getBooking()
```

Rules:
- Sections take content as typed props from `data/`. No copy hardcoded in a
  section component.
- `Reveal` and `LineReveal` are the primary animation primitives. Reach for
  Framer Motion only for the two orchestrated sequences (launch intro, night
  picker fill) and document why.
- Anything using Mapbox or interactive SVG is a `'use client'` component.
  Anything static wraps it as a server component.

---

## 8. Signature elements

There are three. They are why a traveller remembers the site.

### 8.1 The Star Chart (hero centrepiece)
**A rendered constellation chart of the AlUla sky, right now.** SVG, drawn
from curated star and constellation data (`data/stars.ts`). Not a live
telescope feed, not real-time, not a WebGL starfield. A stylised, editorial
chart — like a page from a printed almanac.

Shows: 8 to 12 named constellations visible from AlUla in the current season,
star points sized by magnitude, constellation lines drawn in gold at 40%
opacity, star names in mono at small sizes. Draws in on load (motion 2).

**It must never look like a screensaver.** No twinkling, no parallax, no
mouse-tracked stars. This is a diagram, not an effect.

Sits past the right edge of the hero grid, softly cropped by the viewport
edge. Asymmetry is deliberate.

### 8.2 The Night Picker (interactive centrepiece)
**"What's the sky doing on the night of your trip?"** A calendar showing the
next 60 days, each date cell coloured by expected sky quality for AlUla:
moon phase (from `astro.ts`) modulated by an assumed clear-sky baseline.
The visitor picks a date. The panel beside the calendar fills with:
- The moon graphic for that night
- What constellations will be prominently visible
- Which of the 4 dark-sky sites are best suited (some sites have terrain
  advantages for certain celestial targets — Sharaan for southern sky, etc.)
- Every available experience on that date, priced

Direct path from picker to booking. This is the product in one screen.

**Why it exists**, in the terms of §2.2 rule 10: it answers the traveller's
one real question ("when should I go?") in a way no competitor does. It gives
them the picture of their own trip before they book.

### 8.3 The Site Map (Mapbox)
Four dark-sky sites plotted on a stylised Mapbox map of the AlUla region.
Custom map style: cream base, ink terrain, gold site markers, no roads or
labels beyond the essentials. Click a site to open its detail. The map is
information, not a game — no cluster animations, no fly-to camera swoops on
every interaction. One gentle initial fly-in on load, and that is it.

The map also drives the offline mode: on first load, cache the four site
tiles and their detail pages, so a traveller in the desert without signal
can still see their next booking and how to reach it.

---

## 9. Data model (Supabase / Postgres)

Relational schema, DDL in `migrations/`. RLS enabled from table creation.

```
operators
  id              uuid pk
  slug            text unique
  name            text
  contact_email   text
  approved        bool default true    -- v1: all seeded operators are approved
  created_at      timestamptz default now()

sites
  id              uuid pk
  slug            text unique          -- 'manara', 'algharameel', 'sharaan', 'wadi-nakhlah'
  name            text
  lat             numeric
  lng             numeric
  elevation_m    integer
  bortle_class    integer              -- 1 to 9, lower is darker
  description     text
  best_for        text[]               -- ['southern-sky', 'milky-way-core', ...]

experiences
  id              uuid pk
  operator_id     uuid fk operators.id
  site_id         uuid fk sites.id
  slug            text unique
  title           text
  description     text
  duration_min    integer
  price_sar       numeric
  group_min       integer
  group_max       integer
  requires_dark   bool                 -- true = needs new-moon-adjacent nights
  active          bool default true

availability
  id              uuid pk
  experience_id   uuid fk experiences.id
  date            date
  slots_remaining integer

bookings
  id              uuid pk
  experience_id   uuid fk experiences.id
  date            date
  guest_count     integer
  contact_name    text
  contact_email   text
  contact_phone   text
  status          text                 -- 'pending' | 'confirmed' | 'cancelled'
  reference       text unique          -- human-readable, e.g. 'SUH-4X2K9'
  created_at      timestamptz default now()
```

Every booking creates a real row. Data survives refresh. This is a hard
requirement from the Ravyn brief.

---

## 11. Room for personality

The rules above define the shape. They do not define the character. Suhail
should feel like a product someone made with care, not an assembly of best
practices. Claude Code has explicit permission to:

- **Add small, considered touches** that make a surface feel intentional —
  a tasteful hover state, a subtle sound-off animation on the moon phase,
  a well-timed reveal on the booking reference. One per surface.
- **Make copy warmer where it fits.** The astrotourism category tolerates a
  little atmosphere in the writing. "Book your night under the stars" is
  fine; "Book now" is fine; "Book — the sky awaits" is corporate and cut.
- **Choose the exact interaction pattern** for elements that aren't specified
  down to the pixel. If the night picker calendar reads better as a
  horizontally-scrollable strip than a grid on mobile, make that call.
- **Suggest one signature detail per stage** that isn't in the plan, before
  building it. Small proposals, one line each. If it fits, it ships.

What personality is not:
- Injecting an emoji "for warmth" (still banned per §2.1/2)
- Adding a second animated background layer
- A cursor-tracked comet trail
- A themed 404 with jokes
- Any element whose purpose is "delight" with no functional reason to exist

The test for personality: **can a real product-minded person defend this,
or is it filler with a smiley face?** If it is filler, cut it. If it feels
considered, ship it.

---

## 12. What "done" means for the demo

From the Ravyn brief, non-negotiable:
- Live public URL on Vercel, reachable from anywhere
- One core workflow end to end: **land → pick a night → see experiences →
  book → confirmation** — every step working, no dead clicks
- Real data persistence in Supabase, verifiable in the dashboard
- Authentication only if needed — v1 uses email confirmation, no login
- Built with Claude Code. Direct it well.

Beyond the brief, Suhail's own bar for the demo:
- Launch intro fires once on first visit, respects reduced-motion
- Star chart renders on the hero without layout shift
- Night picker works for the next 60 days
- Mapbox map loads with the 4 sites and correct styling
- PWA install prompt appears on second visit, offline mode caches the last
  viewed booking
- Mobile bottom nav has exactly three icons
- Every route in `/app` has a real page, no 404s from linked destinations

Nothing else is required for v1. Everything else is roadmap.
