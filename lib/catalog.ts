import { supabasePublic } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { SkyTarget } from "@/data/sites";

/* Reading the public catalogue: operators, sites, experiences and which
   nights each experience is running.

   This comes from Supabase rather than from data/experiences.ts even though
   the two hold the same records. The night picker links a traveller straight
   into /book/[experienceId], and that id has to be the real primary key the
   booking row will reference. The TypeScript files are the source the seed
   script writes from; the database is what the product reads.

   Four small queries joined in JavaScript rather than one nested PostgREST
   select. The hand-written Database types carry empty Relationships, so
   nested selects do not type through, and the whole catalogue is under 300
   rows. Regenerating the types after a schema change would allow the join,
   but this is clearer to read and cheaper to reason about. */

export type CatalogSite = {
  id: string;
  slug: string;
  name: string;
  bestFor: SkyTarget[];
};

export type CatalogExperience = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationMin: number | null;
  priceSar: number | null;
  groupMin: number;
  groupMax: number | null;
  requiresDark: boolean;
  site: CatalogSite;
  operatorName: string;
  /** date keys, `2026-08-14`, on which this experience still has slots */
  dates: string[];
  /** how many seats are left on each of those dates, keyed by date key */
  slotsByDate: Record<string, number>;
};

export type Catalog = {
  experiences: CatalogExperience[];
  /** how many sites the catalogue actually holds, for the live stats line */
  siteCount: number;
  /** null when everything loaded. a real message when it did not. */
  error: string | null;
};

const EMPTY: Catalog = { experiences: [], siteCount: 0, error: null };

/** One page below PostgREST's default ceiling, so a full page is unambiguous. */
const PAGE = 1000;

type AvailabilityRow = { experience_id: string; date: string; slots_remaining: number };

/**
 * Every availability row in the window, following the pages to the end.
 *
 * Returns the same `{ data, error }` shape as a Supabase query so the caller's
 * error handling does not have to special-case it.
 */
async function fetchAllAvailability(
  db: ReturnType<typeof supabasePublic>,
  from: string,
  to: string,
): Promise<{ data: AvailabilityRow[] | null; error: { message: string } | null }> {
  const rows: AvailabilityRow[] = [];

  for (let page = 0; ; page++) {
    const { data, error } = await db
      .from("availability")
      .select()
      .gte("date", from)
      .lte("date", to)
      .gt("slots_remaining", 0)
      /* ordered so the pages partition the set deterministically. without it
         the server may return overlapping or missing rows between calls. */
      .order("experience_id", { ascending: true })
      .order("date", { ascending: true })
      .range(page * PAGE, (page + 1) * PAGE - 1);

    if (error) return { data: null, error };
    if (!data?.length) break;

    rows.push(...(data as AvailabilityRow[]));
    /* a short page is the last one */
    if (data.length < PAGE) break;
  }

  return { data: rows, error: null };
}

/**
 * The catalogue for a window of nights.
 *
 * Never throws and never invents. If Supabase is unreachable or unconfigured
 * the error comes back as text for the surface to show, because a night
 * picker that silently shows no experiences is indistinguishable from one
 * where nothing is running.
 */
export async function getCatalog(from: string, to: string): Promise<Catalog> {
  if (!isSupabaseConfigured()) {
    return {
      ...EMPTY,
      error: "NOT_CONFIGURED: Supabase environment variables are missing.",
    };
  }

  const db = supabasePublic();

  /* Availability is paged rather than fetched in one call.
   *
   * PostgREST caps a response at 1000 rows by default and says nothing about
   * having done so: the request succeeds and the tail is simply missing. With
   * nineteen experiences over a sixty-night window that is 1140 rows, and the
   * two experiences past the cap lost every one of their dates and vanished
   * from the "tonight" filter. The page read "17 experiences" against a
   * catalogue of nineteen, with no error anywhere.
   *
   * Kept as an explicit loop rather than a bigger .limit() because the cap is
   * the server's to enforce, not ours to guess at, and the window grows with
   * both the catalogue and the number of nights offered. */
  const [experiences, sites, operators, availability] = await Promise.all([
    db.from("experiences").select().eq("active", true),
    db.from("sites").select(),
    db.from("operators").select(),
    fetchAllAvailability(db, from, to),
  ]);

  const failure = [experiences, sites, operators, availability].find((r) => r.error);
  if (failure?.error) {
    return { ...EMPTY, error: `Could not load the catalogue: ${failure.error.message}` };
  }

  const siteById = new Map(
    (sites.data ?? []).map((s) => [
      s.id,
      { id: s.id, slug: s.slug, name: s.name, bestFor: (s.best_for ?? []) as SkyTarget[] },
    ]),
  );
  const operatorById = new Map((operators.data ?? []).map((o) => [o.id, o.name]));

  const datesByExperience = new Map<string, string[]>();
  /* The seat count behind each of those dates. The search view prints it, so
     it comes from the availability row rather than being estimated. */
  const slotsByExperience = new Map<string, Record<string, number>>();
  for (const row of availability.data ?? []) {
    const list = datesByExperience.get(row.experience_id);
    if (list) list.push(row.date);
    else datesByExperience.set(row.experience_id, [row.date]);

    const slots = slotsByExperience.get(row.experience_id) ?? {};
    slots[row.date] = row.slots_remaining;
    slotsByExperience.set(row.experience_id, slots);
  }

  const list: CatalogExperience[] = [];
  for (const e of experiences.data ?? []) {
    const site = siteById.get(e.site_id);
    /* an experience whose site or operator is missing is a broken row, not
       something to paper over with a placeholder name */
    if (!site) continue;

    list.push({
      id: e.id,
      slug: e.slug,
      title: e.title,
      description: e.description,
      durationMin: e.duration_min,
      priceSar: e.price_sar,
      groupMin: e.group_min,
      groupMax: e.group_max,
      requiresDark: e.requires_dark,
      site,
      operatorName: operatorById.get(e.operator_id) ?? "Unknown operator",
      dates: (datesByExperience.get(e.id) ?? []).sort(),
      slotsByDate: slotsByExperience.get(e.id) ?? {},
    });
  }

  /* cheapest first, as the night picker panel presents them */
  list.sort((a, b) => (a.priceSar ?? Infinity) - (b.priceSar ?? Infinity));

  return { experiences: list, siteCount: siteById.size, error: null };
}
