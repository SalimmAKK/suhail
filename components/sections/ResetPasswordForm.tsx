"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { onSessionChange, updatePassword } from "@/lib/auth";

/* The page a password-reset email link lands on.
 *
 * Supabase's reset link carries a one-time token in the URL fragment, which
 * the browser client (lib/supabase.ts, detectSessionInUrl defaults to on)
 * exchanges for a real session automatically on load — that is what
 * onSessionChange below picks up. There is no separate "verify this token"
 * step for this component to get wrong; if a session shows up, the link was
 * valid, and updatePassword can go straight to supabase-js's own updateUser.
 *
 * A link that is missing, expired, or already used never produces a session,
 * which is the "invalid or expired" state below — distinguished from still
 * loading by a short grace period rather than an arbitrary spinner.
 */

type State =
  | { phase: "waiting" }
  | { phase: "ready" }
  | { phase: "invalid" }
  | { phase: "saving" }
  | { phase: "done" }
  | { phase: "error"; message: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ phase: "waiting" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const unsubscribe = onSessionChange((session) => {
      setState((prev) => {
        if (prev.phase !== "waiting") return prev;
        return session ? { phase: "ready" } : prev;
      });
    });
    /* Supabase's own token exchange runs on mount; if nothing has produced a
       session shortly after, the link was invalid rather than just slow. */
    const timeout = setTimeout(() => {
      setState((prev) => (prev.phase === "waiting" ? { phase: "invalid" } : prev));
    }, 3000);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setState({ phase: "error", message: "Those two passwords don't match." });
      return;
    }
    setState({ phase: "saving" });
    const result = await updatePassword(password);
    if (!result.ok) {
      setState({ phase: "error", message: result.error });
      return;
    }
    setState({ phase: "done" });
  }

  if (state.phase === "waiting") {
    return <p className="text-neutral-700">Checking your reset link.</p>;
  }

  if (state.phase === "invalid") {
    return (
      <div className="border-2 border-divider bg-surface/40 p-6">
        <p className="font-display text-label uppercase tracking-label text-accent-700">
          Link not valid
        </p>
        <h2 className="mt-2 text-2xl">This link has expired or was already used.</h2>
        <p className="mt-3 max-w-[46ch] text-neutral-700">
          Request a fresh one from the sign-in page.
        </p>
        <Button href="/login" variant="primary" className="mt-6">
          Back to sign in
        </Button>
      </div>
    );
  }

  if (state.phase === "done") {
    return (
      <div className="border-2 border-divider bg-surface/40 p-6">
        <p className="font-display text-label uppercase tracking-label text-accent-700">Done</p>
        <h2 className="mt-2 text-2xl">Password updated.</h2>
        <p className="mt-3 max-w-[46ch] text-neutral-700">
          You&rsquo;re signed in with it already.
        </p>
        <Button
          type="button"
          variant="primary"
          className="mt-6"
          onClick={() => router.push("/account")}
        >
          Go to your account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field
        label="New password"
        name="password"
        type="password"
        required
        hint="At least 8 characters."
        value={password}
        onValueChange={setPassword}
      />
      <Field
        label="Confirm new password"
        name="confirm"
        type="password"
        required
        value={confirm}
        onValueChange={setConfirm}
      />

      {state.phase === "error" ? (
        <p className="border-2 border-accent-2-600 bg-accent-2-100 p-4 text-[14px] leading-[1.6] text-text">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={state.phase === "saving"}>
        {state.phase === "saving" ? "Saving..." : "Set new password"}
      </Button>
    </form>
  );
}
