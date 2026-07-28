import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

/* Linking a guest booking to an account after the fact.
 *
 * The gap this closes: someone books as a guest, then later signs up or
 * signs in with the same email. Nothing automatically connects the two — a
 * guest booking's user_id stays null forever unless something sets it, and
 * migrations/003_accounts.sql's "bookings readable by owner" policy only
 * ever matches rows already tagged with auth.uid(). This is that "something".
 *
 * Runs on the server with the service role because the match itself —
 * contact_email = this account's email, user_id is null — reaches across
 * rows the calling account does not yet own, which the RLS policies
 * deliberately do not allow a client to do directly (anon has no select on
 * bookings at all, and authenticated's select/update policies are both
 * scoped to auth.uid() already). The safety boundary is verifying the
 * caller's own access token server-side rather than trusting a client-
 * supplied email: nobody can claim bookings under an email they cannot
 * prove they are signed in as.
 */

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  if (!token) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const db = supabaseServer();

  const { data: userData, error: userError } = await db.auth.getUser(token);
  if (userError || !userData.user?.email) {
    return NextResponse.json({ error: "Session is not valid. Sign in again." }, { status: 401 });
  }

  const { data, error } = await db
    .from("bookings")
    .update({ user_id: userData.user.id })
    .eq("contact_email", userData.user.email)
    .is("user_id", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ claimed: data?.length ?? 0 });
}
