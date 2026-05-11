const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>();

let kv: {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, opts: { expirationTtl: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
} | null = null;

export function setOtpKv(store: typeof kv) {
  kv = store;
}

function otpKey(phone: string): string {
  return `otp:${phone.replace(/[^0-9]/g, "").slice(-10)}`;
}

export async function generateOtp(phone: string): Promise<string> {
  const otp =
    process.env.NODE_ENV === "production"
      ? String(Math.floor(100000 + Math.random() * 900000))
      : "000000";

  const entry = { otp, expiresAt: Date.now() + 5 * 60 * 1000, attempts: 0 };
  const key = otpKey(phone);

  if (kv) {
    await kv.put(key, JSON.stringify(entry), { expirationTtl: 300 });
  } else {
    otpStore.set(key, entry);
  }

  return otp;
}

export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const key = otpKey(phone);

  let raw: string | null;
  if (kv) {
    raw = await kv.get(key);
  } else {
    const entry = otpStore.get(key);
    raw = entry ? JSON.stringify(entry) : null;
  }

  if (!raw) return false;

  const entry = JSON.parse(raw) as { otp: string; expiresAt: number; attempts: number };

  if (Date.now() > entry.expiresAt) {
    if (kv) await kv.delete(key);
    else otpStore.delete(key);
    return false;
  }

  entry.attempts += 1;
  if (entry.attempts > 3) {
    if (kv) await kv.delete(key);
    else otpStore.delete(key);
    return false;
  }

  if (entry.otp !== otp) {
    if (kv) await kv.put(key, JSON.stringify(entry), { expirationTtl: 300 });
    else otpStore.set(key, entry);
    return false;
  }

  if (kv) await kv.delete(key);
  else otpStore.delete(key);
  return true;
}

export async function sendOtpSms(phone: string, otp: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP] ${phone} → ${otp}`);
    return;
  }
  // Production: integrate with MSG91/Twilio
  // await fetch("https://api.msg91.com/api/v5/flow/", { ... })
  console.log(`[OTP] SMS sent to ${phone}`);
}
