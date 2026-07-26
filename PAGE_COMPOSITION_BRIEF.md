# Page composition brief — the homepage is inventory, not a marketing hero

This is the piece that's been missing across every previous attempt. The
palette (DESIGN_SYSTEM_REPLACEMENT.md) and typography were right. The
problem is structural: the current homepage is a hero section (headline,
paragraph, two CTAs) with the actual bookable content — the night picker —
in a separate section below it. The approved mockup's homepage is not that.
It opens directly on live inventory: a count, a filter row, a grid of
individual bookable experiences, and a map. This document specifies
rebuilding the homepage to match that composition.

## What the homepage becomes, top to bottom

1. **A compact header line**, not a full hero section:
   - Eyebrow: "TONIGHT OVER ALULA" (keep, it works)
   - One short headline — "The sky is open over AlUla." or similar, one
     line, not the current two-line "Look up. Then book." treatment
   - One line of live stats in the format: **"[N] experiences · [N] sites
     · sorted by sky quality"** — pulled from real Supabase counts, not
     hardcoded. **Real data note: the mockup showed "23 experiences." The
     actual seeded count is 3 (Husaak's Stargazing at Gharameel, Pangaea's
     Stargazing at Sharaan, Pangaea's Sharaan Safari). Show the real number.
     Do not pad the count or invent additional experiences to match the
     mockup's number** — this is the same no-fabrication rule that shaped
     Stage 3's honest 3-not-6 decision. If 3 feels thin for the layout,
     that's a real signal, not a reason to invent — flag it back to me
     rather than solving it with fake inventory.

2. **A filter/sort row** immediately below, matching the mockup's pattern:
   tabs or a row of controls for **Tonight / This Week / Pick a Date**, plus
   sort/filter toggles for **Sky Quality / Duration / Group Size / Price**.
   These should be real and functional against the actual experience/
   availability data, not decorative — reuse `lib/astro.ts` sky-quality
   logic and the real experience fields (`duration_min`, `group_max`,
   `price_sar`) already in the schema. If full filtering logic is too much
   scope right now, ship Tonight/This Week/Pick a Date as functional and
   the other four as visually present but flagged `// TODO: wire filter
   logic` rather than fake-functional.

3. **A card grid of real bookable experiences**, not a single reference
   card. Each card: experience photo (placeholder per the existing
   convention, labeled `PLACEHOLDER IMAGE, NOT [SITE]`), Bortle/sky-quality
   badge, site name, duration + start time, title, operator name, price.
   This is the mockup's actual card component — recreate its layout
   (image top, badges overlaid, title + meta below) using Desert Nocturne
   colors and Archivo/sharp-corner styling from DESIGN_SYSTEM_REPLACEMENT.md.
   With only 3 real experiences, the grid will be short — that's honest,
   ship it short rather than padding it.

4. **A map panel**, reusing the Stage 6 Mapbox component and its existing
   approximate-marker/withheld-site conventions exactly as built — don't
   rebuild the map, just place it in this new layout (likely a right-hand
   column on desktop, alongside or below the card grid, stacking on mobile).

5. **The star chart and night picker** (Stage 4/5's signature elements)
   move to `/tonight` as their own full experience if they don't already
   live there well — check current `/tonight` route content before moving
   anything, don't duplicate. The homepage's job is now "show me what's
   bookable right now," not "introduce the concept and send me elsewhere."
   The star chart can still appear on the homepage if there's a natural
   compact placement (e.g. a small inline element near the header stats),
   but it is no longer the dominant hero visual — the inventory grid is.

## What stays exactly as-is

- Nav, mobile nav — already correctly recolored per the screenshot, don't
  touch further
- All Stage 1-7 business logic, routing, Supabase schema, RLS, astro
  calculations, booking flow
- The ambient starfield background element, if it's still reading well
  against the new denser layout — check it doesn't visually compete with
  the card grid's own imagery, reduce its density or remove it from this
  page specifically if it does

## Why this wasn't caught earlier

Every previous brief treated "redesign" as tokens and layout of a single
hero section, because that's the literal scope I kept assigning it. The
actual signal was always in the content density of the mockup itself — a
live count, a filter row, a grid of real bookable things — and that never
got named directly until now. Flagging this here so it's understood, not
repeated in a future stage.

## Verify before reporting done

- Real Supabase-sourced counts in the stats line, not hardcoded
- All 3 real experiences render as cards with correct real data (price,
  operator, site) — cross-check against `data/experiences.ts` /
  the seeded Supabase rows
- Map still shows the correct 3-visible-1-withheld site convention from
  Stage 6
- Screenshot at desktop and mobile before calling this done
