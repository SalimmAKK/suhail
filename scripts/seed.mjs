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
const SLOTS_PER_NIGHT = 12;

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
  console.log(`experiences  ${EXPERIENCES.length}`);
  for (const e of EXPERIENCES) {
    console.log(`  ${e.slug.padEnd(24)} ${e.title}  SAR ${e.priceSar}  ${e.siteSlug}/${e.operatorSlug}`);
    for (const v of e.verify) console.log(`      VERIFY: ${v}`);
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
await upsert(
  "availability",
  experiences.flatMap((e) =>
    nights(NIGHTS).map((date) => ({
      experience_id: e.id,
      date,
      slots_remaining: SLOTS_PER_NIGHT,
    })),
  ),
  "experience_id,date",
);

console.log("\nseeded");
