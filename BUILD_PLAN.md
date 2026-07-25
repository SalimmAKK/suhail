# BUILD_PLAN.md / Suhail

Read CLAUDE.md first. This file is the sequence — what to build, in what
order, with commit boundaries. Follow it top to bottom. Do not skip ahead.
Do not batch stages. Commit at the end of each stage, then pause and confirm
before moving to the next.

The plan is designed for a three-day build. Times are estimates for one
person directing Claude Code with a MacBook and no meetings.

---

## Ground rules for Claude Code

1. **One stage per session.** At each stage boundary, stop and let the user
   review before continuing. This is not for approval theatre — it is because
   Suhail is a two-week concept being built in three days, and drift is the
   only real risk.
2. **Files only.** Claude Code writes files. It does not run `npm run dev`,
   does not spawn Node processes, does not start Supabase locally. Execution
   is a separate step done by the user (via Antigravity or manually), per
   Salim's established working pattern that prevents the memory issue from
   spawning too many Node workers.
3. **Commit at every stage boundary.** Use conventional commit messages,
   scoped to the stage: `feat(stage-2): scaffold nav + shell + palette`.
4. **Never invent facts.** All copy either comes from `content/` (which the
   user will populate) or is marked `[VERIFY: description]` and left visible.
5. **Every change must build.** After each file change of consequence, run
   `next build` to catch static-export or App Router regressions early.

---

## Stage 0 — Environment (30 min, before Claude Code)

**Done by the user, not by Claude Code.**

- [ ] `npx create-next-app@latest suhail --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
- [ ] Create Supabase project `suhail-demo` in the me-south-1 (Bahrain)
      region (PDPL-adjacent — good habit even for a demo)
- [ ] Create Mapbox account, generate a public token, restrict it to the
      demo Vercel URL and localhost
- [ ] Add to `.env.local`:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)
      - `NEXT_PUBLIC_MAPBOX_TOKEN`
- [ ] Create the empty Vercel project, link to a new GitHub repo, do one
      initial `git push` so deployment is proven from stage 0.
- [ ] Copy `CLAUDE.md` and `BUILD_PLAN.md` to the repo root.

**Commit:** `chore: initial scaffold + env`

---

## Stage 1 — Design system port (2 hours)

Port the palette, fonts, tokens, and animation primitives from edu-hub.
No content yet. No pages beyond a styleguide route.

**Claude Code tasks:**
1. Replace `app/globals.css` with Suhail tokens per CLAUDE.md §5.
2. Replace `tailwind.config.ts` to expose those tokens (cream, ink, gold,
   sand, sky-1 through sky-5, attention, danger).
3. Set up `next/font/google` in `app/layout.tsx` with Bricolage Grotesque,
   IBM Plex Sans, IBM Plex Mono.
4. Port these files verbatim from edu-hub (adjusting only import paths):
   - `lib/cn.ts`
   - `components/ui/Button.tsx` (retune variants to Suhail palette: `primary`
     = ink, `accent` = gold, `light` = gold on dark)
   - `components/ui/Card.tsx`
   - `components/ui/Eyebrow.tsx`
   - `components/ui/Field.tsx`
   - `components/ui/Reveal.tsx`
   - `components/ui/LineReveal.tsx`
   - `components/layout/Shell.tsx`
5. Create three new Suhail-specific UI primitives:
   - `components/ui/CoordinateTag.tsx` — mono row, dots between fields
   - `components/ui/MoonPhase.tsx` — SVG circle, takes `phase` prop (0 to 1),
     renders lit vs unlit portion
   - `components/ui/SkyPip.tsx` — small pill with dot: `Prime`, `Ok`, `Bright`
6. Add a `/styleguide` route showing every UI primitive in isolation. Delete
   before demo but useful during build.
7. Add the `.js` root class inline script from edu-hub's layout so `Reveal`
   and `LineReveal` progressive enhancement works.

**Verify before committing:**
- `next build` clean
- `/styleguide` renders every component with correct palette
- Fonts loading (network tab shows Bricolage, Plex Sans, Plex Mono)

**Commit:** `feat(stage-1): palette, fonts, ui primitives ported from edu-hub`

---

## Stage 2 — Nav, shell, launch intro (2 hours)

The frame the whole product hangs on.

**Claude Code tasks:**
1. `components/layout/Nav.tsx` — desktop top nav. Wordmark left, five links
   right (`Tonight`, `Sites`, `About`, `Contact`, and a `Book` CTA button).
   **Glassmorphic surface**: `backdrop-blur-md` over `bg-cream/60` on light
   pages, `bg-ink/40` on dark pages, hairline `border-b border-line`.
   Detect the current section's background via context or a class on
   `<body>` set by the section. Sticky at the top.
2. `components/layout/MobileNav.tsx` — fixed bottom nav for viewports under
   `md`. Same glass treatment as the desktop nav. Exactly three icons:
   `Sky` (star chart, `/tonight`), `Sites` (`/sites`), `Trips` (`/trips` —
   placeholder route showing "no bookings yet"). Each icon has a mono label
   under it. Active state uses gold.
3. `components/layout/SmoothScroll.tsx` — Lenis wrapper, mounted in root
   layout. Config: gentle damping, disabled under `prefers-reduced-motion`.
4. `components/layout/LaunchIntro.tsx` — the one-time intro. Full-viewport
   ink backdrop, wordmark "Suhail" fades in letter by letter (Framer Motion,
   500ms), coordinate line `CANOPUS · α CARINAE · 06h 23m 57s` fades in
   under, 300ms hold, fade out over 400ms. Set `sessionStorage['suhail-intro']`
   so it only fires once per session. Fully skipped when reduced-motion.
5. Wire all four into `app/layout.tsx`.

**Verify:**
- Intro fires on first load, not on reload
- Mobile nav has exactly three icons and does not appear on `md+`
- Reduced-motion completely skips intro (test with devtools emulation)

**Commit:** `feat(stage-2): nav, mobile bottom nav, launch intro, smooth scroll`

---

## Stage 3 — Data layer (1.5 hours)

Supabase schema, seed data, typed data helpers. No UI yet.

**Claude Code tasks:**
1. `migrations/001_init.sql` — the exact DDL from CLAUDE.md §9. Include
   RLS policies: read-only anon access to `sites`, `operators`, `experiences`,
   `availability`; insert-only anon access to `bookings` with column
   restrictions (no direct status override from client).
2. `lib/supabase.ts` — client factory. Two exports: `supabaseBrowser()` and
   `supabaseServer()`. Never expose service role key to the browser.
3. `data/sites.ts` — the four dark-sky sites, hardcoded, with real lat/long
   for Manara, AlGharameel, Sharaan, Wadi Nakhlah.
4. `data/stars.ts` — curated dataset. 8 to 12 constellations visible from
   AlUla (~26.85°N) across the four seasons. For each: name, English name,
   season(s), bounding box in RA/Dec, and array of star points
   (`{ra, dec, mag, name?}`) and connection lines.
5. `data/experiences.ts` — 6 seed experiences across the four sites and
   3 operators. Real operator names (Pangaea Adventures, Husaak, etc. — use
   real ones sourced from public listings). Real-ish prices (SAR 300-600).
6. `lib/astro.ts` — pure functions:
   - `moonPhase(date: Date): number` — 0 (new) to 1 (full)
   - `moonPhaseLabel(phase: number): 'new' | 'crescent' | 'quarter' | 'gibbous' | 'full'`
   - `skyQuality(date: Date): 'prime' | 'ok' | 'bright'` — based on moon phase
   - `visibleConstellations(date: Date, lat: number): string[]` — filter
     `data/stars.ts` by season and altitude
   No external astro libraries. Use standard formulas from Meeus's
   *Astronomical Algorithms* — moon phase to acceptable precision is a
   few lines of arithmetic.
7. `lib/booking.ts` — `createBooking(input)` writes to Supabase, generates a
   `SUH-XXXXX` reference; `getBooking(reference)` reads by reference. Both
   typed with the Supabase generated types.
8. Migration run from user's local machine, not Claude Code. Seed inserted
   via Supabase dashboard or a one-off `scripts/seed.ts`.

**Verify:**
- All tables exist in Supabase dashboard
- Seed data visible in each table
- `moonPhase(new Date())` returns a plausible value
- `createBooking()` writes a real row and returns the reference

**Commit:** `feat(stage-3): supabase schema, seed data, astro helpers`

---

## Stage 4 — Star chart + hero (3 hours)

The signature centrepiece for the landing page. This is the highest-risk
component visually, so it happens early to leave room for iteration.

**Claude Code tasks:**
1. `components/sections/StarChart.tsx` — pure SVG constellation renderer.
   Takes `date` and `siteLat` props, calls `visibleConstellations`, maps
   RA/Dec to viewBox X/Y with a stereographic projection, draws:
   - Star points: circles sized by magnitude (`r = 3.5 - mag * 0.5`, clamped)
   - Constellation lines: gold at 40% opacity, 1px stroke
   - Star names: mono, 9px, gold-deep, offset from bright stars only
   Draw-in animation: constellation line `stroke-dasharray` from 0 to full,
   star points fade in 200ms after their line completes, 900ms total.
2. `components/ui/AmbientStars.tsx` — the atmosphere layer per CLAUDE.md §5.
   Static SVG, 40 to 60 tiny star points scattered pseudo-randomly (seeded
   for consistent positions across renders). Each star twinkles its opacity
   between 30% and 60% on an independent 4 to 8 second cycle. Global slow
   horizontal drift of no more than 8px over 60 seconds. Fully paused under
   `prefers-reduced-motion`. Renders behind the hero content, never behind
   the star chart's viewBox area.
3. `components/sections/Hero.tsx` — landing hero. `AmbientStars` layer at
   the back. Left column: eyebrow (`— TONIGHT OVER ALULA`), LineReveal h1
   (`Look up. Then book.` on two lines), sub, primary CTA (`Pick a night`),
   secondary CTA (`See the sites`). Right column: `StarChart` for tonight's
   date at AlUla lat, bleeding past the right grid edge on `lg+`, softly
   cropped by the viewport.
4. Below hero, a `CoordinateTag` strip: `26.85°N · ALULA, KSA · ELEVATION
   692M · BORTLE 2 · TONIGHT'S MOON: 34%` (dynamic).
5. Wire into `app/page.tsx` (server component).

**Verify:**
- Chart renders without layout shift
- Constellation lines draw in visibly
- No stars appear on the wrong side of the sky for the current season
- Chart is legible on both cream and ink backgrounds (render both variants
  and check contrast)

**Commit:** `feat(stage-4): star chart + hero with tonight's sky`

---

## Stage 5 — The Night Picker (4 hours, most complex stage)

Suhail's interactive centrepiece. Do not compress this.

**Claude Code tasks:**
1. `components/sections/NightPicker.tsx` — client component. Layout:
   left half is a 60-day calendar grid (10 rows × 6 cols), each cell shows
   day number and a `SkyPip` coloured by `skyQuality(date)`; right half is
   an initially-empty detail panel.
2. Cell fill animation: on mount, each cell's sky-quality colour fills from
   bottom via `scaleY` transform, staggered by row (motion 3, 350ms).
3. On cell click, populate detail panel:
   - Selected date, moon phase graphic, phase label
   - `visibleConstellations(date, 26.85)` as a mono list
   - Sites best suited (filter `sites.best_for` against tonight's targets)
   - Every experience active on that date, sorted by price, each with a
     `Book this night` link to `/book/[experienceId]?date=YYYY-MM-DD`
4. Panel change animation: fade + 8px slide, 200ms, only on state change,
   not on initial mount.
5. `app/tonight/page.tsx` — dedicated page using the same component full-width.

**Verify:**
- Every one of the next 60 dates is clickable
- Selected state persists visually
- Panel updates match the astro helpers
- Reduced-motion disables the cell-fill animation but keeps the picker functional

**Commit:** `feat(stage-5): night picker — pick a date, see the sky, see experiences`

---

## Stage 6 — Sites + Mapbox (2.5 hours)

**Claude Code tasks:**
1. `components/sections/SiteMap.tsx` — client component wrapping Mapbox GL.
   Custom style based on `light-v11`, retuned to cream/ink palette (define
   inline as a style JSON, or use a hosted Mapbox Studio style if the user
   configures one). Four gold markers at the four site lat/long. Click a
   marker to open a small popover with site name + `View site` link.
2. On initial load: one gentle 1200ms fly-in from a zoomed-out view to the
   AlUla region. Never re-fly on interaction.
3. `app/sites/page.tsx` — map on top half, four site cards below (using
   `Card` component), each linking to `/sites/[slug]`.
4. `app/sites/[slug]/page.tsx` — per-site detail. Header with site name,
   `CoordinateTag` with lat/long/elevation/Bortle, description, star chart
   biased to that site's `best_for` targets, list of experiences at that
   site. `generateStaticParams` returns the four slugs.

**Verify:**
- Map loads in under 2s
- No console warnings from Mapbox
- All four site detail routes render
- Custom style matches Suhail palette (no default Mapbox blue anywhere)

**Commit:** `feat(stage-6): mapbox site map + per-site detail pages`

---

## Stage 7 — Booking flow (3 hours)

The one non-negotiable outcome: a traveller can complete a real booking
end to end, and it persists to Supabase as a real row that survives refresh.
Everything else about how the flow feels is Claude Code's call.

**Required outcomes:**
- A booking route reachable from any experience card
- Some sensible flow that captures: which night, how many guests, contact
  details, and a mock payment step clearly labelled `demo mode`
- On completion, `lib/booking.createBooking()` writes to Supabase, returns a
  `SUH-XXXXX` reference, and navigates to a confirmation route
- The confirmation route pulls the booking back from Supabase (not just from
  local state) so refresh proves persistence
- A trips route reachable from the mobile `Trips` icon that lists past
  bookings for this browser (persisted references in localStorage is fine)
- Broken form states render real errors, never silently fail

**Latitude Claude Code has:**
- The flow can be a single scrollable page or a stepped wizard — whichever
  reads better with real content in it. Try both if unsure.
- The confirmation screen has room for personality. A well-set booking
  reference, a moon graphic for the booked night, one considered touch
  (a subtle reveal on the reference, a small `saved` moment) is welcome.
  See §11 of CLAUDE.md.
- Add-to-calendar (.ics generation) is a nice-to-have, not a requirement.

**Verify:**
- End-to-end: land → pick night → click experience → complete flow → see
  confirmation with a real DB row (check Supabase dashboard)
- Refresh the confirmation URL — booking still shows
- Booking reference is unique across at least 10 test bookings
- Trips page shows every booking made in this session

**Commit:** `feat(stage-7): end-to-end booking with supabase persistence`

---

## Stage 8 — PWA + offline mode (4 hours)

The user has committed to full offline mode. The outcomes below are required;
the caching strategy is Claude Code's to design.

**Required outcomes:**
- Installable PWA: manifest, icons, service worker, "Installable" green in
  Chrome devtools
- Install prompt appears on the second visit, never the first
- App shell (HTML, JS, CSS from the current build) loads offline
- The four site detail pages and the site map load offline once visited
- The last-viewed booking loads offline
- Booking is clearly disabled when offline (with a real message, not silent
  failure) — do not queue bookings for later sync, that's phase-3 complexity
- An `/offline` fallback page renders when navigation fails, showing what
  the user *can* still do (view cached trips and site info)

**Latitude Claude Code has:**
- Pick the service worker strategy that best fits each surface. `next-pwa`
  presets are fine, custom Workbox routes are fine. What matters is the
  outcome above.
- IndexedDB vs localStorage for cached bookings is Claude Code's call —
  IndexedDB is more robust but adds a dependency.
- Mapbox tile caching is nice-to-have. If it's fighting the build, ship
  without it and rely on Mapbox's own offline capability being unavailable
  as a known limitation.

**If time runs short:**
Ship the manifest, install prompt, and app-shell cache (roughly the first
three bullets). Label the offline booking cache as a phase-2 story in the
pitch. The demo still shows PWA install and that is the credible talking
point.

**Verify:**
- Chrome devtools application tab: service worker active, manifest valid,
  install prompt eligible
- Airplane mode: `/`, `/tonight`, `/sites`, `/sites/[any-visited-slug]`, and
  the last booked confirmation all still load
- Reserve button clearly disabled offline with a message

**Commit:** `feat(stage-8): pwa + offline mode`

---

## Stage 9 — Copy, seed, polish (3 hours)

At this stage everything works. Now make it feel like a real product.

**Claude Code tasks (executed against a copy document the user provides):**
1. Populate all copy from `content/copy.md` into the appropriate `data/`
   files. Every `[VERIFY: …]` placeholder either resolves or stays visible.
2. Add real photography credits in the footer if any photos are used from
   the RCU or Experience AlUla with proper attribution.
3. Add the `About` page: single-paragraph founder note, no fake team, links
   to the pitch documents (Vol. 01 through Vol. 04).
4. Add the `Contact` page: a simple form via `lib/forms.ts` that surfaces a
   real error `NOT_CONFIGURED` until an endpoint is wired (matches Salim's
   edu-hub pattern — never fake success).
5. Verify no `href="#"` remain anywhere. Every link either functions or is
   labelled `non functional in prototype`.
6. Add `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` (star chart
   snapshot with wordmark overlay).

**Commit:** `feat(stage-9): copy, seed, polish, seo`

---

## Stage 10 — Deploy + verify (2 hours)

**Claude Code tasks:** none. This is the user driving Vercel + validating.

- [ ] Push to `main` — Vercel builds automatically
- [ ] Fix any preview URL regressions from earlier stages
- [ ] Open the production URL on a phone, install as PWA, use it end to end
- [ ] Test airplane mode with a fresh Chrome profile — the cached experience
      confirms offline mode works
- [ ] Run Lighthouse — aim for PWA passing, Performance and Accessibility
      in a defensible range. Fix the top one or two low-effort wins if any.
- [ ] Optional sanity check: send the URL to one person outside the project
      and watch them try to book. Not a pass/fail gate, just a signal for
      what to polish in the next hour if anything obvious surfaces.

**Commit:** `chore(stage-10): production deploy verified`

---

## What's out of scope for this build

Listed here so Claude Code does not drift into them.

- Multi-language / Arabic UI (phase 2)
- Operator self-service portal (v1 seeds manually)
- Real Mada or Stripe payment integration (v1 is demo mode)
- User accounts and login (v1 uses email confirmation only)
- Push notifications
- Reviews and ratings
- Multi-region expansion (UAE, Oman)
- Any interaction that requires WebSocket / realtime
- Any 3D or WebGL element (star chart is deliberately SVG)

---

## If a stage runs long

- Never skip stages 3, 5, or 7 — those are the load-bearing product moments.
- If PWA (stage 8) is too tight, ship stage 8.1–8.3 only (manifest, install
  prompt, basic shell cache) and label the offline booking cache as a
  phase-2 story in the pitch. The demo still shows PWA install.
- Stage 4 (star chart) is the visual centrepiece. If it looks bad, spend
  the extra time. It sets the ceiling for how memorable the site feels.
- Never ship without stage 7 working end-to-end. A broken booking flow
  fails the Ravyn brief's "core workflow" requirement, which is 15 percent
  of the grade.
