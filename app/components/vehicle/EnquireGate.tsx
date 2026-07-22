"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Field";
import { EnquiryForm } from "@/app/vehicle/[id]/EnquiryForm";

export function EnquireGate({
  listingId,
  isLoggedIn,
  defaults,
}: {
  listingId: string;
  isLoggedIn: boolean;
  defaults?: { name: string; email: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (open) {
    return <EnquiryForm listingId={listingId} defaults={defaults} />;
  }

  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        if (!isLoggedIn) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/vehicle/${listingId}`)}`);
          return;
        }
        setOpen(true);
      }}
    >
      Enquire now
    </Button>
  );
}
