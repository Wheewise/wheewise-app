const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

export function isValidGstin(gstin: string): boolean {
  return GSTIN_RE.test(gstin.replace(/\s/g, "").toUpperCase());
}

export async function verifyGstin(
  gstin: string,
): Promise<{ legalName: string; tradeName: string; address: string } | null> {
  const cleaned = gstin.replace(/\s/g, "").toUpperCase();

  if (!isValidGstin(cleaned)) return null;

  // Production: call GSTN API or compliance partner (e.g. ClearTax, Razorpay GST)
  // const res = await fetch(`https://api.cleartax.in/gstin/${cleaned}`, { ... })
  // For demo, return mock data for valid-format GSTINs
  return {
    legalName: "Demo Motors Private Limited",
    tradeName: "Demo Wheels",
    address: "Shop 12, Auto Nagar, Indore, MP 452001",
  };
}
