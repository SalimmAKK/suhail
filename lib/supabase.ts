import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/* Two clients, and the difference between them matters.

   supabaseBrowser() uses the anon key, which is published to the browser by
   design. Everything it can do is bounded by the RLS policies in
   migrations/001_init.sql: read the catalogue, insert a pending booking,
   nothing else. It cannot read bookings back.

   supabaseServer() uses the service role key, which bypasses RLS entirely.
   It must never be imported into a client component. The guard below throws
   if it ever is, because the failure mode of leaking that key is every
   guest's contact details, and a build-time crash is a far better outcome
   than a silent one.

   CLAUDE.md section 3: never expose the service role key to the browser. */

export type SuhailClient = SupabaseClient<Database>;

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (see BUILD_PLAN stage 0) and restart.`,
    );
  }
  return value;
}

let publicClient: SuhailClient | null = null;

/**
 * The anon client. Safe anywhere, browser or server, because everything it
 * can do is bounded by the RLS policies.
 *
 * Server code reading the public catalogue should use this rather than
 * supabaseServer(): the catalogue is anon-readable by policy, so there is no
 * reason to reach for a key that bypasses row-level security to read it.
 */
export function supabasePublic(): SuhailClient {
  /* one instance per process or tab: a new client per render leaks sockets */
  if (publicClient) return publicClient;

  publicClient = createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    { auth: { persistSession: false } },
  );
  return publicClient;
}

/** The same anon client, named for use from client components. */
export const supabaseBrowser = supabasePublic;

/** Server components, route handlers and server actions only. Bypasses RLS. */
export function supabaseServer(): SuhailClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "supabaseServer() was called in the browser. It holds the service role key, which bypasses row-level security. Use supabaseBrowser() instead.",
    );
  }

  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** True when the environment is wired up. Lets a surface say so honestly. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
