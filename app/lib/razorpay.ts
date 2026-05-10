import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const razorpay =
  keyId && keySecret
    ? new Razorpay({ key_id: keyId, key_secret: keySecret })
    : null;

export const PLAN_IDS = {
  MONTHLY: process.env.RAZORPAY_PLAN_MONTHLY ?? "",
  YEARLY: process.env.RAZORPAY_PLAN_YEARLY ?? "",
} as const;

export type RazorpayPlanTier = keyof typeof PLAN_IDS;

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

export type RazorpayWebhookEvent = {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        status: string;
        current_end?: number;
        notes?: Record<string, string>;
      };
    };
  };
};
