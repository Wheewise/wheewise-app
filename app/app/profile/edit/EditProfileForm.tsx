"use client";

import { useActionState } from "react";
import { updateProfile, type UpdateProfileState } from "@/lib/actions/profile";
import { Field, Input, Button } from "@/components/ui/Field";

export function EditProfileForm({
  initial,
}: {
  initial: { name: string; phone: string; district: string; state: string };
}) {
  const [state, formAction, pending] = useActionState<UpdateProfileState, FormData>(
    updateProfile,
    undefined,
  );
  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" name="name" errors={errors.name}>
        <Input id="name" name="name" defaultValue={initial.name} autoComplete="name" required />
      </Field>
      <Field label="Phone number" name="phone" errors={errors.phone}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          autoComplete="tel"
          required
        />
      </Field>
      <Field label="District" name="district" errors={errors.district}>
        <Input
          id="district"
          name="district"
          defaultValue={initial.district}
          autoComplete="address-level2"
          required
        />
      </Field>
      <Field label="State" name="state" errors={errors.state}>
        <Input
          id="state"
          name="state"
          defaultValue={initial.state}
          autoComplete="address-level1"
          required
        />
      </Field>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
