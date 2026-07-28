"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase";

/* Server actions behind /operators' two buttons: confirm a pending booking,
 * or cancel one. This is the operator side of the loop that account holders
 * already have on /account (lib/account.ts's cancelMyBooking) — until now a
 * booking could sit at 'pending' forever with no way for anyone running the
 * business to move it forward.
 *
 * Runs with the service role, same as the rest of this route (lib/
 * operators.ts). That is deliberate here too: /operators has no operator
 * login of its own (CLAUDE.md 2.4/17, no self-service portal), so there is
 * no narrower role to act as. The route's only real gate is staying out of
 * public nav and disallowed in robots.ts.
 *
 * migrations/004_restore_slots_on_cancel.sql's trigger is what frees the
 * seat back up when either action below sets status to 'cancelled' — this
 * file only ever writes to bookings, never to availability directly.
 */

async function setStatus(id: string, status: "confirmed" | "cancelled") {
  const { error } = await supabaseServer().from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(`Could not update booking ${id}: ${error.message}`);
  revalidatePath("/operators");
}

/* Bound with .bind(null, id) at the call site, which is why each takes the
   id first and an unused FormData last: that is the shape a <form action={}>
   bound this way calls it with. */
export async function confirmBooking(id: string, _formData: FormData) {
  await setStatus(id, "confirmed");
}

export async function cancelBooking(id: string, _formData: FormData) {
  await setStatus(id, "cancelled");
}
