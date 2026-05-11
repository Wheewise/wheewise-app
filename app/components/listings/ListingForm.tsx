"use client";

import { useActionState, useState, useCallback } from "react";
import { Field, Input, Button } from "@/components/ui/Field";
import { PhotoUploader } from "./PhotoUploader";
import { RtoLookup } from "./RtoLookup";
import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_TYPES } from "@/lib/validators/listing";
import type { ListingActionState } from "@/lib/actions/listings";

type Defaults = {
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  fuelType?: string;
  transmission?: string | null;
  odometerKm?: number;
  askingPrice?: number;
  description?: string;
  city?: string;
  photoUrls?: string[];
};

export function ListingForm({
  action,
  defaults = {},
  submitLabel = "Save listing",
}: {
  action: (state: ListingActionState, formData: FormData) => Promise<ListingActionState>;
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<ListingActionState, FormData>(
    action,
    undefined,
  );

  const [make, setMake] = useState(defaults.make ?? "");
  const [model, setModel] = useState(defaults.model ?? "");
  const [year, setYear] = useState(defaults.year?.toString() ?? "");
  const [fuelType, setFuelType] = useState(defaults.fuelType ?? "PETROL");

  const handleRtoFetched = useCallback(
    (data: { make: string; model: string; year: number; fuelType: string }) => {
      setMake(data.make);
      setModel(data.model);
      setYear(String(data.year));
      setFuelType(data.fuelType);
    },
    [],
  );

  const errors = state && "ok" in state && state.ok === false ? state.errors : {};

  const select =
    "block w-full rounded-md border border-border-default bg-background px-3 py-2 text-sm shadow-xs outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20";

  return (
    <form action={formAction} className="space-y-6">
      <RtoLookup onFetched={handleRtoFetched} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle type" name="vehicleType" errors={errors.vehicleType}>
          <select
            id="vehicleType"
            name="vehicleType"
            defaultValue={defaults.vehicleType ?? "CAR"}
            className={select}
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v} value={v}>
                {v[0] + v.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City" name="city" errors={errors.city}>
          <Input id="city" name="city" defaultValue={defaults.city} required />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Make" name="make" errors={errors.make}>
          <Input
            id="make"
            name="make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            required
          />
        </Field>
        <Field label="Model" name="model" errors={errors.model}>
          <Input
            id="model"
            name="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
          />
        </Field>
        <Field label="Year" name="year" errors={errors.year}>
          <Input
            id="year"
            name="year"
            type="number"
            min={1980}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Fuel type" name="fuelType" errors={errors.fuelType}>
          <select
            id="fuelType"
            name="fuelType"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
            className={select}
          >
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f[0] + f.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Transmission" name="transmission" errors={errors.transmission}>
          <select
            id="transmission"
            name="transmission"
            defaultValue={defaults.transmission ?? ""}
            className={select}
          >
            <option value="">—</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>
                {t[0] + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Odometer (km)" name="odometerKm" errors={errors.odometerKm}>
          <Input
            id="odometerKm"
            name="odometerKm"
            type="number"
            min={0}
            defaultValue={defaults.odometerKm}
            required
          />
        </Field>
      </div>

      <Field label="Asking price (₹)" name="askingPrice" errors={errors.askingPrice}>
        <Input
          id="askingPrice"
          name="askingPrice"
          type="number"
          min={1000}
          defaultValue={defaults.askingPrice}
          required
        />
      </Field>

      <Field label="Description" name="description" errors={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaults.description}
          className={select}
          required
        />
      </Field>

      <div>
        <label className="block text-sm font-medium">Photos</label>
        <p className="mb-2 text-xs text-zinc-500">
          {errors.photoUrls?.[0] ?? "At least one photo required."}
        </p>
        <PhotoUploader initialPhotos={defaults.photoUrls ?? []} />
      </div>

      {state && "ok" in state && state.ok === false && state.formError ? (
        <p className="bg-brand-red/10 text-brand-red rounded-md px-3 py-2 text-sm">
          {state.formError}
        </p>
      ) : null}
      {state && "ok" in state && state.ok === true ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
