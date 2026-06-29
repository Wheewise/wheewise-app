"use client";

import { useEffect } from "react";
import { incrementViewCount } from "./view-actions";

interface ViewCounterProps {
  listingId: string;
  dealerId: string;
}

export function ViewCounter({ listingId, dealerId }: ViewCounterProps) {
  useEffect(() => {
    incrementViewCount(listingId, dealerId).catch(() => {});
  }, [listingId, dealerId]);

  return null;
}
