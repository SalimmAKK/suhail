# Design reference brief — content ideas from the Claude Design mockup

Context for Claude Code: the user explored two design directions in Claude
Design (a separate AI design tool), including a later revision with the rail
nav removed. Both explorations used a different visual system (Archivo font,
orange/red accent, heavy borders, black-and-white photography) than Suhail's
established one. After review, the decision is: **Suhail's visual system
(Desert Nocturne palette, Bricolage Grotesque / IBM Plex fonts, glass pill
nav, hairline card treatment) stays exactly as built through Stage 6. None
of the mockup's colors, fonts, or photography treatment are being adopted.**

One structural note also confirmed: the mockup included an "Operators" tab in
its public top nav. This stays out of Suhail's public navigation, per
CLAUDE.md §2.4 rule 17 — the `/operators` route remains unlinked from public
nav, demo-only, exactly as originally scoped.

What follows is a short list of **content and information-architecture
ideas**, translated into Suhail's actual system, not the mockup's. Treat
every item below as "consider this shape," not "build this exact thing."

**Important — the mockup invented a lot of specific facts for illustration.**
None of the following are real and none should be reproduced or referenced as
real content: a named guide ("Dr. Hala Al-Ansari"), a fictional operator
("Sirius Expeditions"), specific meteor shower/eclipse dates and magnitudes, a
fifth site ("Harrat Uwayrid" — not in `data/sites.ts`), live cloud cover and
seeing forecasts, specific seat-availability counts. Where an idea below
depends on data Suhail doesn't actually have (e.g. real-time cloud cover),
it's flagged as a roadmap idea requiring a data source decision, not something
to fabricate a number for.

---

## For Stage 7 (booking flow) — worth adopting

1. **A compact "sky at your slot" summary inside the booking panel.**
   Alongside date/guest fields, a small block showing what the astro helpers
   already know for the selected night: moon phase and set time, sky quality
   band, Milky Way core visibility if applicable. This is all real data
   `lib/astro.ts` already computes — just surfacing it at the point of
   booking, not a new data source. Good instinct: it reinforces the "you're
   booking a specific sky, not a generic slot" premise right at conversion.

2. **A pickup/meeting-point field**, if any seeded experience actually has
   one (check `data/experiences.ts` — Sharaan Safari's transfer/pickup
   details may already have this). Only include if real.

3. **A trust strip near the CTA** — free cancellation window, and if the
   user wants to consider a weather-based refund policy, that's a real
   business decision to make explicitly (not invent copy for). Flag as an
   open question rather than shipping placeholder policy text.

4. **"Direct booking, no OTA fee" as a small badge near price** — this is
   actually true and sourced: it's the whole premise of Suhail's 15%
   commission model from Vol. 03. Worth surfacing as a trust signal, using
   real language from the business case rather than inventing new copy.

## For a site or experience detail page — worth adopting

5. **A four-up facts strip** (duration, sky quality, group size, elevation)
   using big numbers with small mono labels underneath — this translates
   well into the existing `CoordinateTag`-style mono treatment already in
   the system. Only populate fields with real seeded data; leave a field out
   entirely rather than inventing a number for it.

6. **A time-stamped itinerary list** for an experience's run-of-show, if any
   seeded experience actually has published timing detail (check operator
   listings). This is a nice format idea — worth using only where real
   itinerary information exists.

## For Stage 5's night picker panel — worth considering as enrichment, not required

7. **A twilight window visualization** (sunset → astronomical dusk → dark
   window → astronomical dawn → sunrise) as a compact bar. `lib/astro.ts`
   or `lib/sidereal.ts` may already have enough to compute real twilight
   times for AlUla's latitude — if so, this could enrich the existing panel.
   If real twilight computation isn't already in place, this is a "nice to
   have, real math required" item, not urgent for the demo.

8. **A "what's up, with altitude" list** — the existing panel already lists
   visible constellations; adding altitude-at-zenith-transit for each is a
   nice specificity upgrade if the math is already available from Stage 4's
   chart work, not worth new astronomical modeling for.

## Explicitly not adopted — flagging so it isn't rediscovered later

- Live cloud cover / seeing forecast — requires a weather API Suhail doesn't
  have. Real roadmap item if pursued, needs an explicit data-source decision
  first, not a fabricated number.
- ISS pass predictions — same issue, needs a real orbital data source (e.g.
  N2YO API) and is a phase-2 idea at best.
- Notable astronomical events list (meteor showers, eclipses, conjunctions)
  with specific dates — these are real astronomical events in principle, but
  the specific dates/magnitudes in the mockup were invented for illustration.
  If this is wanted later, it needs real ephemeris data, not placeholder
  dates that look precise.
- A fifth site or any operator/guide names beyond what's seeded in
  `data/sites.ts` and the two real operators (Husaak, Pangaea) from Stage 3.

---

---

## Optional — a structural idea, not required by BUILD_PLAN

9. **A dedicated experience browse page with a split list+map layout**, if
   the user wants one later. Suhail's current plan has `/sites` (map + 4
   site cards) but no page that lists all bookable experiences across sites
   side-by-side with a map. If this gets added, it's a legitimate travel-
   booking pattern (similar to Airbnb/Booking.com), rebuilt entirely in
   Suhail's existing card/hairline/glass-pill language — not the mockup's
   heavy-border, orange-accent treatment. Not in scope for Stage 7 unless
   explicitly requested; flagging so it isn't lost.

Nothing here changes Stage 7's required outcomes from BUILD_PLAN.md. Items 1
and 4 are the ones worth folding into the actual build since they use data
Suhail already has. The rest are optional enrichment — mention if there's
natural time, skip without concern if not.
