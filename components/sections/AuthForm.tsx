"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { signIn, signUp, validateCredentials } from "@/lib/auth";

/* Sign in or create an account, one form that toggles between the two.
 *
 * Supabase Auth handles the actual credential storage and email
 * confirmation; this is the same validate-then-call-then-show-the-real-error
 * shape as every other form in this codebase (lib/booking.ts, lib/contact.ts).
 * Never fakes success: a sign-up that requires email confirmation says so
 * rather than acting as if it signed the traveller in.
 */

type Mode = "sign-in" | "sign-up";
type State =
  | { phase: "idle" | "sending" }
  | { phase: "confirm-email" }
  | { phase: "error"; message: string };

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/account";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const invalid = validateCredentials(email, password);
    if (invalid) {
      setState({ phase: "error", message: invalid });
      return;
    }

    setState({ phase: "sending" });

    if (mode === "sign-up") {
      const result = await signUp(email, password);
      if (!result.ok) {
        setState({ phase: "error", message: result.error });
        return;
      }
      if (result.needsConfirmation) {
        setState({ phase: "confirm-email" });
        return;
      }
      router.push(redirectTo);
      return;
    }

    const result = await signIn(email, password);
    if (!result.ok) {
      setState({ phase: "error", message: result.error });
      return;
    }
    router.push(redirectTo);
  }

  if (state.phase === "confirm-email") {
    return (
      <div className="border-2 border-divider bg-surface/40 p-6">
        <p className="font-display text-label uppercase tracking-label text-accent-700">
          Check your email
        </p>
        <h2 className="mt-2 text-2xl">Almost there.</h2>
        <p className="mt-3 max-w-[46ch] text-neutral-700">
          A confirmation link went to {email}. Follow it, then come back and sign in.
        </p>
        <Button
          type="button"
          variant="primary"
          className="mt-6"
          onClick={() => {
            setMode("sign-in");
            setState({ phase: "idle" });
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-1 border-b-2 border-divider">
        {(["sign-in", "sign-up"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setState({ phase: "idle" });
            }}
            className={
              "px-4 py-3 font-display text-label uppercase tracking-label transition-colors duration-150 ease-move " +
              (mode === m ? "border-b-2 border-accent text-text" : "text-neutral-600 hover:text-text")
            }
            style={{ marginBottom: "-2px" }}
          >
            {m === "sign-in" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <Field
          label="Email"
          name="email"
          type="email"
          required
          value={email}
          onValueChange={setEmail}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          hint={mode === "sign-up" ? "At least 8 characters." : undefined}
          value={password}
          onValueChange={setPassword}
        />

        {state.phase === "error" ? (
          <p className="border-2 border-accent-2-600 bg-accent-2-100 p-4 text-[14px] leading-[1.6] text-text">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" variant="primary" disabled={state.phase === "sending"}>
          {state.phase === "sending"
            ? mode === "sign-up"
              ? "Creating account..."
              : "Signing in..."
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
