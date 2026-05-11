import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_PLAN_MONTHLY: z.string().optional(),
  RAZORPAY_PLAN_YEARLY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

let parsed = false;

try {
  serverSchema.parse(process.env);
  publicSchema.parse(process.env);
  parsed = true;
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.issues
      .filter((i) => i.code === "invalid_type")
      .map((i) => i.path.join("."));
    if (missing.length > 0) {
      console.error(`Missing required env vars: ${missing.join(", ")}`);
    }
    console.error(error.flatten().fieldErrors);
  }
}

export const env = { parsed };
