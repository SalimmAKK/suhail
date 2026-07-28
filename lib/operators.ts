import { supabaseServer } from "@/lib/supabase";
import { OPERATORS as SEED_OPERATORS } from "@/data/experiences";

/* The admin view behind /operators.
 *
 * CLAUDE.md section 4 lists this route explicitly: "Seeded operators +
 * bookings received." Section 2.4/17 keeps it out of public navigation
 * because it is a decision about access to booking data, not a style one —
 * the route itself is meant to exist and work.
 *
 * There is no login in v1 (section 12: "email confirmation, no login"), so
 * there is no auth boundary this page could actually enforce. What it does
 * instead is the same restraint the rest of the product uses for booking
 * data: a traveller's name and how many seats they took, not their email or
 * phone number. An operator fulfilling a booking needs the name and the
 * headcount; the contact details exist for Suhail to reach a guest, not for
 * this page to republish them.
 *
 * The three separate queries joined in JS, rather than one nested
 * PostgREST select, are the same shape lib/catalog.ts already uses and for
 * the same reason: the hand-written Database types carry empty
 * Relationships, so a nested select does not type through.
 */

export type OperatorBooking = {
  reference: string;
  date: string;
  guestCount: number;
  contactName: string;
  status: string;
  createdAt: string;
};

export type OperatorExperience = {
  id: string;
  slug: string;
  title: string;
  priceSar: number | null;
  active: boolean;
  bookings: OperatorBooking[];
};

export type OperatorOverview = {
  slug: string;
  name: string;
  approved: boolean;
  /** demo inventory written for the prototype, not a sourced operator */
  fictional: boolean;
  experiences: OperatorExperience[];
  bookingCount: number;
};

export type OperatorsPage = {
  operators: OperatorOverview[];
  totalBookings: number;
  error: string | null;
};

const EMPTY: OperatorsPage = { operators: [], totalBookings: 0, error: null };

export async function getOperatorsOverview(): Promise<OperatorsPage> {
  const db = supabaseServer();

  const [operators, experiences, bookings] = await Promise.all([
    db.from("operators").select(),
    db.from("experiences").select(),
    db.from("bookings").select().order("created_at", { ascending: false }),
  ]);

  const failure = [operators, experiences, bookings].find((r) => r.error);
  if (failure?.error) {
    return { ...EMPTY, error: `Could not load operator data: ${failure.error.message}` };
  }

  const fictionalBySlug = new Map(SEED_OPERATORS.map((o) => [o.slug, o.fictional]));

  const bookingsByExperience = new Map<string, OperatorBooking[]>();
  for (const row of bookings.data ?? []) {
    const list = bookingsByExperience.get(row.experience_id) ?? [];
    list.push({
      reference: row.reference,
      date: row.date,
      guestCount: row.guest_count,
      contactName: row.contact_name,
      status: row.status,
      createdAt: row.created_at,
    });
    bookingsByExperience.set(row.experience_id, list);
  }

  const experiencesByOperator = new Map<string, OperatorExperience[]>();
  for (const row of experiences.data ?? []) {
    const list = experiencesByOperator.get(row.operator_id) ?? [];
    list.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      priceSar: row.price_sar,
      active: row.active,
      bookings: bookingsByExperience.get(row.id) ?? [],
    });
    experiencesByOperator.set(row.operator_id, list);
  }

  const list: OperatorOverview[] = (operators.data ?? []).map((op) => {
    const ownExperiences = experiencesByOperator.get(op.id) ?? [];
    return {
      slug: op.slug,
      name: op.name,
      approved: op.approved,
      fictional: fictionalBySlug.get(op.slug) ?? false,
      experiences: ownExperiences,
      bookingCount: ownExperiences.reduce((sum, e) => sum + e.bookings.length, 0),
    };
  });

  /* operators with at least one booking float to the top: the page answers
     "who has bookings to fulfil" before it answers "who is seeded at all" */
  list.sort((a, b) => b.bookingCount - a.bookingCount);

  return {
    operators: list,
    totalBookings: bookings.data?.length ?? 0,
    error: null,
  };
}
