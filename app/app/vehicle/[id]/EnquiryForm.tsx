"use client";

import { useState } from "react";
import { Field, Input, Button } from "@/components/ui/Field";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string; fields?: Record<string, string[]> };

export function EnquiryForm({
  listingId,
  defaults,
}: {
  listingId: string;
  defaults?: { name: string; email: string };
}) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        buyerName: fd.get("buyerName"),
        buyerPhone: fd.get("buyerPhone"),
        buyerEmail: fd.get("buyerEmail") || undefined,
        message: fd.get("message") || undefined,
      }),
    });
    if (res.ok) {
      setState({ kind: "success" });
      return;
    }
    const body = await res.json().catch(() => ({}));
    setState({
      kind: "error",
      message: body.error ?? "Something went wrong",
      fields: body.fields,
    });
  }

  if (state.kind === "success") {
    return (
      <div className="rounded-md bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
        Thanks! The dealer has been notified and will reach out shortly.
      </div>
    );
  }

  const errs = state.kind === "error" ? state.fields ?? {} : {};

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field label="Your name" name="buyerName" errors={errs.buyerName}>
        <Input
          id="buyerName"
          name="buyerName"
          required
          autoComplete="name"
          defaultValue={defaults?.name ?? ""}
        />
      </Field>
      <Field label="Phone" name="buyerPhone" errors={errs.buyerPhone}>
        <Input
          id="buyerPhone"
          name="buyerPhone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
        />
      </Field>
      <Field label="Email (optional)" name="buyerEmail" errors={errs.buyerEmail}>
        <Input
          id="buyerEmail"
          name="buyerEmail"
          type="email"
          autoComplete="email"
          defaultValue={defaults?.email ?? ""}
        />
      </Field>
      <Field label="Message (optional)" name="message" errors={errs.message}>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={1000}
          className="block w-full rounded-md border border-border-default bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
          placeholder="When can I see this vehicle?"
        />
      </Field>
      {state.kind === "error" ? (
        <p className="rounded-md bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={state.kind === "submitting"}
        className="w-full"
      >
        {state.kind === "submitting" ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
