/* Seeds the Supabase project from data/sites.ts and data/experiences.ts.
 *
 *   node scripts/seed.mjs --dry-run     print what would be written
 *   node scripts/seed.mjs               write it
 *
 * BUILD_PLAN stage 3 task 8: the migration and the seed are run from the
 * user's machine, not by Claude Code. Run migrations/001_init.sql first.
 *
 * The TypeScript data files are the single source of truth. Node strips the
 * types natively, so this imports them rather than restating the records in
 * SQL where the two could drift.
 *
 * Uses the service role key: seeding writes to tables that are read-only
 * under RLS. It is idempotent, keyed on slug, so re-running updates rather
 * than duplicating.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { SITES } from "../data/sites.ts";
import { EXPERIENCES, OPERATORS } from "../data/experiences.ts";

const DRY = process.argv.includes("--dry-run");
const NIGHTS = 90;

/* Seats left, varied per experience and per night rather than a flat number.
 *
 * A catalogue where every row says "12 seats left" reads as a placeholder, and
 * the search view prints this figure. The ceiling is the experience's own
 * group_max where it has one, so a private night for four never offers
 * fourteen seats.
 *
 * Deterministic on slug plus date, so reseeding does not reshuffle inventory
 * under a booking someone already made against it. */
function slotsFor(slug, date, groupMax) {
  let h = 2166136261;
  for (const ch of `${slug}:${date}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const ceiling = groupMax ?? 14;
  /* weekends run fuller, which is both true of the category and enough
     variation to make the number look like inventory rather than a constant */
  const weekend = [4, 5].includes(new Date(date).getDay()) ? 0.55 : 1;
  const roll = ((h >>> 0) % 1000) / 1000;
  return Math.max(1, Math.round(ceiling * (0.25 + roll * 0.75) * weekend));
}

/* .env.local is not loaded outside Next, so read it here. */
function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* fine: the variables may already be in the environment */
  }
}

function nights(count) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (DRY) {
  console.log(`operators    ${OPERATORS.length}`);
  for (const o of OPERATORS) console.log(`  ${o.slug.padEnd(24)} ${o.name}`);
  console.log(`sites        ${SITES.length}`);
  for (const s of SITES) {
    console.log(`  ${s.slug.padEnd(24)} ${s.name}  ${s.lat}, ${s.lng}  bortle ${s.bortleClass}`);
    for (const v of s.verify) console.log(`      VERIFY: ${v}`);
  }
  const real = EXPERIENCES.filter((e) => !e.fictional).length;
  console.log(`experiences  ${EXPERIENCES.length}  (${real} sourced, ${EXPERIENCES.length - real} fictional)`);
  for (const e of EXPERIENCES) {
    const mark = e.fictional ? "FICTIONAL" : "sourced  ";
    console.log(
      `  ${mark} ${e.slug.padEnd(34)} ${String(e.priceSar).padStart(4)} SAR  ${String(e.durationMin).padStart(3)}m  ${e.category.padEnd(16)} ${e.siteSlug}/${e.operatorSlug}`,
    );
  }
  console.log(`availability ${EXPERIENCES.length * NIGHTS} rows (${NIGHTS} nights x ${EXPERIENCES.length})`);
  console.log(`\nenv: NEXT_PUBLIC_SUPABASE_URL ${url ? "set" : "MISSING"}, SUPABASE_SERVICE_ROLE_KEY ${key ? "set" : "MISSING"}`);
  console.log("dry run, nothing written");
  process.exit(0);
}

if (!url || !key) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local.\nRun with --dry-run to check the data without them.",
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function upsert(table, rows, onConflict) {
  const { data, error } = await db.from(table).upsert(rows, { onConflict }).select();
  if (error) {
    console.error(`${table}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${table.padEnd(13)} ${data.length} rows`);
  return data;
}

const operators = await upsert(
  "operators",
  OPERATORS.map((o) => ({
    slug: o.slug,
    name: o.name,
    contact_email: o.contactEmail,
    approved: o.approved,
  })),
  "slug",
);

const sites = await upsert(
  "sites",
  SITES.map((s) => ({
    slug: s.slug,
    name: s.name,
    lat: s.lat,
    lng: s.lng,
    elevation_m: s.elevationM,
    bortle_class: s.bortleClass,
    description: s.description,
    best_for: s.bestFor,
  })),
  "slug",
);

const operatorId = Object.fromEntries(operators.map((o) => [o.slug, o.id]));
const siteId = Object.fromEntries(sites.map((s) => [s.slug, s.id]));

const experiences = await upsert(
  "experiences",
  EXPERIENCES.map((e) => ({
    operator_id: operatorId[e.operatorSlug],
    site_id: siteId[e.siteSlug],
    slug: e.slug,
    title: e.title,
    description: e.description,
    duration_min: e.durationMin,
    price_sar: e.priceSar,
    group_min: e.groupMin,
    group_max: e.groupMax,
    requires_dark: e.requiresDark,
    active: e.active,
  })),
  "slug",
);

/* Every experience is offered on every night for the demo window. Which
   nights are actually worth booking is the night picker's job, computed from
   the moon rather than baked into inventory. */
const seedBySlug = Object.fromEntries(EXPERIENCES.map((e) => [e.slug, e]));

await upsert(
  "availability",
  experiences.flatMap((e) =>
    nights(NIGHTS).map((date) => ({
      experience_id: e.id,
      date,
      slots_remaining: slotsFor(e.slug, date, seedBySlug[e.slug]?.groupMax ?? null),
    })),
  ),
  "experience_id,date",
);

/* Mock bookings for /operators, explicitly authorized as fictional demo data
 * (this is a bootcamp project, not a running marketplace). Fake guests
 * against real seeded experiences, so the admin view has something to show.
 *
 * Reference prefix is DEMO- rather than SUH-, for two reasons: it reads at a
 * glance as fabricated rather than a guest's real booking, and it can never
 * collide with anything a traveller books through the live flow, whose
 * reference always matches the SUH-[A-Z0-9]{5} the RLS policy in
 * migrations/001_init.sql enforces for anon inserts. This script writes
 * through the service role, which bypasses that policy, so the different
 * prefix is available and is what stage-7 verify's cleanup (which only ever
 * deletes references it created itself, all SUH-) will never touch.
 *
 * Idempotent the same way as everything else here: keyed on reference. */
const nightPool = nights(NIGHTS);
const MOCK_BOOKINGS = [
  { slug: "stargazing-at-gharameel", night: 5, guests: 2, name: "Farah Al-Otaibi", status: "confirmed" },
  { slug: "stargazing-at-gharameel", night: 12, guests: 4, name: "Michael Brennan", status: "confirmed" },
  { slug: "stargazing-at-sharaan", night: 8, guests: 2, name: "Noura Al-Qahtani", status: "confirmed" },
  { slug: "stargazing-at-sharaan", night: 21, guests: 6, name: "Elena Vasquez", status: "pending" },
  { slug: "sharaan-safari", night: 9, guests: 3, name: "Yusuf Demir", status: "confirmed" },
  { slug: "gharameel-milky-way-photography", night: 15, guests: 2, name: "Priya Nair", status: "confirmed" },
  { slug: "gharameel-family-first-stars", night: 18, guests: 5, name: "Khalid Al-Harbi", status: "confirmed" },
  { slug: "gharameel-new-moon-camp", night: 27, guests: 2, name: "Sarah Whitfield", status: "cancelled" },
  { slug: "sharaan-deep-sky-telescope", night: 22, guests: 2, name: "Omar Ziyad", status: "confirmed" },
  { slug: "sharaan-canyon-dinner", night: 30, guests: 4, name: "Lucia Moretti", status: "confirmed" },
  { slug: "sharaan-sunset-to-stars", night: 11, guests: 2, name: "Haruto Sato", status: "confirmed" },
  { slug: "manara-astrophotography-workshop", night: 33, guests: 1, name: "Dana Fischer", status: "pending" },
];

function demoReference(seed) {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  let n = h >>> 0;
  for (let i = 0; i < 5; i++) {
    out += alphabet[n % alphabet.length];
    n = Math.floor(n / alphabet.length);
  }
  return `DEMO-${out}`;
}

await upsert(
  "bookings",
  MOCK_BOOKINGS.map((b) => {
    const experienceId = experiences.find((e) => e.slug === b.slug)?.id;
    if (!experienceId) throw new Error(`seed.mjs: no experience seeded for slug "${b.slug}"`);
    const date = nightPool[b.night];
    return {
      experience_id: experienceId,
      date,
      guest_count: b.guests,
      contact_name: b.name,
      contact_email: `${b.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
      status: b.status,
      reference: demoReference(`${b.slug}:${date}:${b.name}`),
    };
  }),
  "reference",
);

console.log("\nseeded");
