/* Stage 3, against the live Supabase project.
 *
 *   npm run verify:stage-3:live
 *
 * Separate from verify:stage-3 because it needs .env.local and a network,
 * and it writes a real row before deleting it again.
 *
 * This is the check that caught the insert-returning problem: the anon
 * policy allows the insert, but `insert ... returning` also needs a select
 * policy, which bookings deliberately does not have. Pure unit checks could
 * not have found that. The RLS escalation cases below are here for the same
 * reason: a policy is a claim about a running database, not about source.
 */

import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.local","utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g,"");
}
const { createBooking, getBooking } = await import("@/lib/booking");
const { supabaseServer, supabaseBrowser } = await import("@/lib/supabase");

let fails = 0;
const check = (n,p,d) => { console.log(`${p?"PASS":"FAIL"}  ${n}\n      ${d}`); if(!p) fails++; };
const admin = supabaseServer();

const { data: exp } = await admin.from("experiences").select("id,slug,title").limit(1).single();
check("seed data is readable", !!exp, `using experience ${exp?.slug}`);

// 1. the real write, through the same path the booking flow will use
const res = await createBooking({
  experienceId: exp.id,
  date: "2026-08-14",
  guestCount: 2,
  contactName: "Stage 3 verification",
  contactEmail: "verify@suhail.test",
  contactPhone: "+966500000000",
});
check("createBooking writes a real row", res.ok, res.ok ? `reference ${res.reference}` : `error: ${res.error}`);
if (!res.ok) process.exit(1);
const ref = res.reference;

// 2. read it back the way the confirmation page will
const back = await getBooking(ref);
check("getBooking reads it back by reference",
  back && back.reference === ref && back.guest_count === 2,
  back ? `${back.reference}, ${back.guest_count} guests, ${back.date}` : "not found");
check("status is forced to pending by RLS", back.status === "pending", `status=${back.status}`);
check("row has a server-assigned id and timestamp", !!back.id && !!back.created_at, `id=${back.id} created_at=${back.created_at}`);
check("getBooking rejects a malformed reference", (await getBooking("nope")) === null, "returns null without querying");
check("getBooking returns null for an unknown reference", (await getBooking("SUH-ZZZZZ")) === null, "returns null");

// 3. RLS actually holds from the browser's key
const anon = supabaseBrowser();
const { data: leak } = await anon.from("bookings").select("*");
check("anon cannot read bookings", !leak || leak.length === 0,
  `anon select returned ${leak ? leak.length : 0} rows (contact details must not be readable)`);

const { error: escalate } = await anon.from("bookings").insert({
  experience_id: exp.id, date: "2026-08-14", guest_count: 1,
  contact_name: "escalation", contact_email: "e@e.co",
  status: "confirmed", reference: "SUH-AAAAA",
});
check("anon cannot self-confirm a booking", !!escalate, `rejected: ${escalate?.message ?? "NOT REJECTED"}`);

const { error: badRef } = await anon.from("bookings").insert({
  experience_id: exp.id, date: "2026-08-14", guest_count: 1,
  contact_name: "bad ref", contact_email: "e@e.co", status: "pending", reference: "HACK-1",
});
check("anon cannot write a malformed reference", !!badRef, `rejected: ${badRef?.message ?? "NOT REJECTED"}`);

const { data: cat } = await anon.from("experiences").select("slug");
check("anon can still read the catalogue", cat && cat.length === 3, `${cat?.length} experiences readable`);

// 4. clean up so the dashboard stays honest
const { error: delErr } = await admin.from("bookings").delete().eq("reference", ref);
const { data: after } = await admin.from("bookings").select("reference");
check("verification row removed", !delErr && after.length === 0, `bookings table now has ${after.length} rows`);

console.log(fails ? `\n${fails} FAILED` : "\nlive booking path verified end to end");
process.exit(fails?1:0);
