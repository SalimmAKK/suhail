import type { Session } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase";

/* Client accounts, on top of Supabase Auth (email + password).
 *
 * migrations/003_accounts.sql is what makes a session mean anything here: it
 * adds the nullable user_id column on bookings and the two RLS policies that
 * let a signed-in traveller read and cancel their own rows, nothing else's.
 * This file is just the thin wrapper around supabase-js's auth client, kept
 * in the same shape as lib/booking.ts and lib/contact.ts: validate, call,
 * return a real error rather than fake success.
 *
 * A note on the confirmation step: this project's Supabase instance has
 * email confirmation on by default for new users, which is the same
 * "email confirmation" CLAUDE.md section 12 already anticipated before any
 * of this existed. signUp() below returns `needsConfirmation: true` when
 * Supabase reports a user with no session, which is what that state looks
 * like, so the UI can say the honest thing rather than assume signup means
 * signed in.
 */

export type AuthResult = { ok: true } | { ok: false; error: string };
export type SignUpResult = { ok: true; needsConfirmation: boolean } | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(email: string, password: string): string | null {
  if (!EMAIL.test(email)) return "That email address does not look right.";
  if (password.length < 8) return "Use at least 8 characters.";
  return null;
}

export async function signUp(email: string, password: string): Promise<SignUpResult> {
  const invalid = validateCredentials(email, password);
  if (invalid) return { ok: false, error: invalid };

  const { data, error } = await supabaseBrowser().auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: error.message };

  return { ok: true, needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabaseBrowser().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabaseBrowser().auth.signOut();
}

/**
 * Sends a password reset email. Always returns ok on a well-formed address,
 * even if no account uses it — Supabase itself does not distinguish "sent"
 * from "no such user" for this call, and echoing that distinction back would
 * let a form become a way to check which emails have accounts.
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!EMAIL.test(email)) return { ok: false, error: "That email address does not look right." };

  const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Sets a new password. Only works with the temporary session Supabase
 * establishes from a valid reset-password link — see app/(platform)/
 * reset-password/page.tsx, which is the only place this is called from.
 */
export async function updatePassword(password: string): Promise<AuthResult> {
  if (password.length < 8) return { ok: false, error: "Use at least 8 characters." };

  const { error } = await supabaseBrowser().auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session;
}

/** Fires immediately with the current session, then on every change. Returns the unsubscribe function. */
export function onSessionChange(callback: (session: Session | null) => void): () => void {
  const {
    data: { subscription },
  } = supabaseBrowser().auth.onAuthStateChange((_event, session) => callback(session));
  return () => subscription.unsubscribe();
}
