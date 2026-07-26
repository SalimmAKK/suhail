# Design system replacement — full adoption

This replaces CLAUDE.md §5, §6 (motion, partially), and §7 (component
naming, partially). This is not an interpretation or a "translate the spirit
of it" brief — the tokens below are copied directly from the approved
Claude Design file's stylesheet
(`_ds/modernist-.../styles.css`, "Modernist" design system) and are to be
adopted exactly as written. Where the current Suhail codebase conflicts with
these tokens, the tokens in this document win.

Read this fully before touching any code. This is a full re-skin of every
page and component already built (Stages 1-7), not a hero-only change like
the previous brief. Supersede `HERO_REDESIGN_BRIEF.md` entirely — do not
follow it, this document replaces it.

## Palette — Desert Nocturne, mapped onto this system's roles

**Revised decision: keep this document's typography, shape, spacing, and
component structure exactly as specified below. Only the color values
change** — back to Suhail's established Desert Nocturne palette, mapped onto
the same variable roles (bg / surface / text / accent / accent-2 / neutral
ramp / accent ramp) so the rest of this document's component specs (which
reference these variable names) still apply unchanged.

```css
--color-bg: #FAF8F3;        /* cream */
--color-surface: #E8DFC9;   /* sand */
--color-text: #1A1D2E;      /* ink */
--color-accent: #C9A961;    /* gold */
--color-accent-2: #E8A33D;  /* amber — secondary accent, was CLAUDE.md's --attention */
--color-divider: color-mix(in srgb, #1A1D2E 40%, transparent);

/* Neutral ramp — warm, ink-tinted, not pure grey */
--color-neutral-100: #FBF9F5;
--color-neutral-200: #F3EFE6;
--color-neutral-300: #E8DFC9;
--color-neutral-400: #D4C9AD;
--color-neutral-500: #B3A78A;
--color-neutral-600: #8F8468;
--color-neutral-700: #6B624C;
--color-neutral-800: #443F32;
--color-neutral-900: #1A1D2E;

/* Accent ramp — tints/shades of gold */
--color-accent-100: #FBF4E4;
--color-accent-200: #F3E4C0;
--color-accent-300: #E8D19A;
--color-accent-400: #DBBB7C;
--color-accent-500: #C9A961;
--color-accent-600: #A8894A;
--color-accent-700: #8A6E38;
--color-accent-800: #6B542A;
--color-accent-900: #4A3A1D;

/* Accent-2 ramp — tints/shades of amber */
--color-accent-2-100: #FDF3E2;
--color-accent-2-200: #FAE3B8;
--color-accent-2-300: #F5CD87;
--color-accent-2-400: #EDB55A;
--color-accent-2-500: #E8A33D;
--color-accent-2-600: #C4841F;
--color-accent-2-700: #9C6816;
--color-accent-2-800: #714B10;
--color-accent-2-900: #4A320B;
```

**This is the only section that changed from the original version of this
document.** Every reference elsewhere in this document to `--color-bg`,
`--color-surface`, `--color-text`, `--color-accent`, `--color-accent-2`, or
any of the neutral/accent ramp steps now resolves to these Desert Nocturne
values instead of the mockup's grey/orange values — the variable names and
every component spec built on them are unchanged. Do not reintroduce
`--cream`, `--ink`, `--gold` etc. as separate variable names — consolidate
onto the `--color-*` naming from this document so there's one token system,
not two.

**Sky-quality semantics** (night picker cells, sky pips — "Prime/Ok/Bright"
night indicators): use the neutral ramp's dark end (`neutral-800`/`900`,
near-ink) for "Prime" dark-sky nights and the light end
(`neutral-200`/`100`, near-cream) for "Bright" moonlit nights, with a
midpoint neutral step for "Ok" — this reads correctly as a literal
light/dark-sky metaphor, which the accent gold ramp doesn't. Reserve the
gold accent ramp for interactive/brand elements (buttons, links, active
states), not for the sky-quality data encoding.

## Typography — full replacement

```css
--font-heading: "Archivo", system-ui, sans-serif;
--font-heading-weight: 800;
--font-body: "Archivo", system-ui, sans-serif;
```

One font family for everything, heading weight 800. This replaces
Bricolage Grotesque, IBM Plex Sans, **and IBM Plex Mono**. There is no
separate mono/coordinate typeface in this system — tracked small-caps
labels (`h6` in the source stylesheet) use Archivo at 13px with
`letter-spacing: 0.08em; text-transform: uppercase`, not a monospace face.
Every place the current codebase uses Plex Mono for coordinate tags, folio
numbers, or labels, switch to this h6 treatment instead.

Type scale (replaces `text-hero`, `text-pull`, `text-label`):
```css
h1 { font-size: 42px; }
h2 { font-size: 32px; }
h3 { font-size: 25px; }
h4 { font-size: 20px; }
h5 { font-size: 16px; }
h6 { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
line-height: 1.12; letter-spacing: -0.015em; (headings)
body font-size: 15px; line-height: 1.55;
```

Note this is a smaller, denser scale than the current hero's
`clamp(48px, 6vw, 84px)` — that clamp-based oversized display type goes
away. Headings are fixed pixel sizes, not fluid clamps, in this system.

## Shape — sharp corners, not pills

```css
--radius-sm: 0px;
--radius-md: 0px;
--radius-lg: 0px;
```

**Every rounded corner in the current build — the pill nav, pill buttons,
rounded cards — becomes square.** This is a hard, deliberate part of this
system's identity (Swiss/editorial, not soft/organic). The nav is no longer
a floating glass capsule; per the source stylesheet's `.nav` class it's a
standard top bar with a `2px solid` bottom divider, not `fixed`/floating,
not blurred glass.

## Spacing

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-6: 24px; --space-8: 32px;
```

## Shadows

```css
--shadow-sm: 0 1px 2px color-mix(in srgb, #2d2b2b 14%, transparent);
--shadow-md: 0 3px 10px color-mix(in srgb, #2d2b2b 16%, transparent);
--shadow-lg: 0 12px 32px color-mix(in srgb, #2d2b2b 22%, transparent);
```

## Components — full replacement

**Buttons.** No more `pill` prop, no more `primary`/`accent`/`light`
three-variant system. Replace with:
- `.btn-primary` — `background: var(--color-accent)`, text `var(--color-bg)`
- `.btn-secondary` — bordered, transparent background
- `.btn-ghost` — text-colored accent, no border, minimal padding
- `.btn-icon` — 36×36px, icon-only

**Cards.** Flat `var(--color-surface)` background, no border, no hover-rule
sweep animation from the current system — replace with `.elev-sm`/`.elev-md`
shadow classes on hover instead if any elevation change is wanted.
`.card-kicker` (10px uppercase tracked accent-colored label) replaces the
current `Eyebrow` component's gold-rule treatment.

**Tags/badges.** New component: `.tag-accent`, `.tag-accent-2`,
`.tag-neutral`, `.tag-outline` — small pill-shaped (this is the one
remaining rounded element per the source, `radius-md * 0.75`) labels for
things like Bortle rating badges, sky-quality indicators, experience
category tags.

**Forms.** `.field`, `.input`, `.radio`, `.seg` (segmented control) — replace
the current `Field` component styling with the surface-background,
divider-bordered treatment from the source.

**Navigation.** Standard top bar, `.nav-brand` left, links right,
`aria-current='page'` gets accent color. Not fixed/floating, not glass, not
a pill. Scrolls with the page or is a normal sticky bar — implementer's
choice, but not the current floating-capsule treatment.

**Tables.** `.table` with uppercase tracked `th`, used for structured data
displays (e.g. experience comparison, booking history) — new pattern not
present in the current build, available if useful for `/trips` or admin
views.

## What does NOT change

- **All application logic, routing, data model, Supabase schema, RLS
  policies, astro calculations, booking flow logic.** This is a visual
  re-skin only. Every route, every function, every piece of business logic
  from Stages 1-7 stays exactly as built.
- **The star chart's underlying geometry** (`lib/astro.ts` math). Its
  presentation (colors, stroke treatment) restyles to the new accent/ink
  palette, but the stereographic projection, constellation data, and
  verified math are untouched.
- **Content and copy** — headlines, body text, data — stays as already
  written unless directly tied to a visual convention being removed (e.g.
  any copy that explicitly referenced "the almanac" or coordinate/instrument
  framing as a design concept, rather than as literal astronomical content,
  can be revisited case by case, flag any you're unsure about rather than
  cutting silently).

## Execution approach

Given the scope (every page, every component, six-plus stages of existing
work), do this systematically rather than page-by-page ad hoc:

1. Replace the token layer first — `globals.css` `@theme` block and the
   `:root` alias block, fonts in `layout.tsx`. Get this compiling clean
   before touching individual components.
2. Update the shared primitives next — `Button`, `Card`, `Field`, `Eyebrow`,
   `Nav`, `MobileNav` — since every page composes from these, fixing them
   first fixes the majority of surface area automatically.
3. Then sweep remaining page-specific styling (hero, night picker cells,
   site cards, booking flow, confirmation) for anything hardcoded that
   doesn't inherit from the primitives.
4. Screenshot every major route at the end — landing, `/tonight`, `/sites`,
   a site detail page, `/book/[id]`, confirmation — before calling this
   done. This is a full visual regression risk across the whole app;
   verify it as one, not assume component-level fixes add up correctly.

## One flag, not a question — a decision, stated plainly

The Claude Design mockup's top nav included an "Operators" tab in public
navigation. Per CLAUDE.md §2.4 rule 17, this stays out of public nav — that
rule is about unsecured access to booking data, not a style preference, and
nothing about this redesign changes that underlying fact. The `/operators`
route stays live and demo-accessible, just not linked from the public `Nav`
component. If this needs revisiting, it's a security/scope conversation, not
a design one — raise it separately if you disagree.
