"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { sendMessage, type ContactInput } from "@/lib/contact";

/* The contact form. Real, not a stub: it writes an actual row to Supabase
 * through migrations/002_messages.sql's insert-only RLS policy, the same
 * pattern lib/booking.ts already established for bookings.
 *
 * Never fakes success. If the migration hasn't been run against this
 * project yet, the insert fails with a real Postgres error and this shows
 * it — including the NOT_CONFIGURED case lib/contact.ts names explicitly —
 * rather than pretending the message went somewhere it didn't.
 */

type State =
  | { phase: "idle" | "sending" }
  | { phase: "sent" }
  | { phase: "error"; message: string; field?: keyof ContactInput };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ phase: "sending" });

    const result = await sendMessage({ name, email, subject, message });

    if (result.ok) {
      setState({ phase: "sent" });
      return;
    }
    setState({ phase: "error", message: result.error, field: result.field });
  }

  if (state.phase === "sent") {
    return (
      <div className="border-2 border-divider bg-surface/40 p-6">
        <p className="font-display text-label uppercase tracking-label text-accent-700">Sent</p>
        <h2 className="mt-2 text-2xl">Got it.</h2>
        <p className="mt-3 max-w-[46ch] text-neutral-700">
          Your message is a real row in the database now. There is no auto-reply in this build, so
          a reply comes from a person reading it, not a system confirming it.
        </p>
      </div>
    );
  }

  const errorFor = (field: keyof ContactInput) =>
    state.phase === "error" && state.field === field ? state.message : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Name"
          name="name"
          required
          error={errorFor("name")}
          value={name}
          onValueChange={setName}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          error={errorFor("email")}
          value={email}
          onValueChange={setEmail}
        />
      </div>
      <Field
        label="Subject"
        name="subject"
        required
        error={errorFor("subject")}
        value={subject}
        onValueChange={setSubject}
      />
      <Field
        label="Message"
        name="message"
        as="textarea"
        rows={6}
        required
        error={errorFor("message")}
        value={message}
        onValueChange={setMessage}
      />

      {/* An error with no specific field is the database itself refusing the
          insert (NOT_CONFIGURED, a network failure) rather than a validation
          problem with one input — shown once, not attached to any field. */}
      {state.phase === "error" && !state.field ? (
        <p className="border-2 border-accent-2-600 bg-accent-2-100 p-4 text-[14px] leading-[1.6] text-text">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={state.phase === "sending"}>
        {state.phase === "sending" ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
