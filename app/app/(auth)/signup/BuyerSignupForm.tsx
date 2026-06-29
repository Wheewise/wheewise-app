"use client";

import { useActionState } from "react";
import { signupBuyer, type SignupState } from "@/lib/actions/auth";
import { Field, Input, Button } from "@/components/ui/Field";

export function BuyerSignupForm() {
  const [state, formAction, pending] = useActionState<SignupState | undefined, FormData>(
    signupBuyer,
    undefined,
  );
  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" name="name" errors={errors.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" name="email" errors={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        name="password"
        errors={errors.password}
        hint="At least 8 characters, one uppercase, one lowercase, one digit, and one special character."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
