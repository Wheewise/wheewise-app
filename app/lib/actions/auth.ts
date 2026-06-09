"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

import { passwordRule } from "@/lib/password";

const buyerSignupSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: passwordRule,
});

const dealerSignupSchema = buyerSignupSchema.extend({
  businessName: z.string().min(2, "Business name is required"),
  city: z.string().min(2, "City is required"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .regex(/^[+\d\s-]+$/, "Use digits, spaces, + or -"),
  whatsapp: z.string().optional(),
});

export type SignupState = { ok: false; errors: Record<string, string[]> } | { ok: true };

function flattenErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors;
}

export async function signupBuyer(
  _prev: SignupState | undefined,
  formData: FormData,
): Promise<SignupState> {
  const parsed = buyerSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenErrors(parsed.error) };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, errors: { email: ["Email already in use"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: "BUYER",
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  redirect("/");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function generateUniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "store";
  let slug = root;
  let i = 1;
  while (await prisma.store.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${root}-${++i}`;
  }
  return slug;
}

export async function signupDealer(
  _prev: SignupState | undefined,
  formData: FormData,
): Promise<SignupState> {
  const parsed = dealerSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
    city: formData.get("city"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, errors: flattenErrors(parsed.error) };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, errors: { email: ["Email already in use"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  // Retry loop: handles slug uniqueness race condition (P2002 unique constraint violation).
  // Crypto-random suffix avoids predictable retries that could collide again.
  const MAX_ATTEMPTS = 5;
  let created = false;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const suffix = attempt > 0 ? `-${randomBytes(3).toString("hex")}` : "";
    const slug = (await generateUniqueSlug(parsed.data.businessName)) + suffix;

    try {
      await prisma.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          passwordHash,
          role: "DEALER",
          dealer: {
            create: {
              businessName: parsed.data.businessName,
              city: parsed.data.city,
              phone: parsed.data.phone,
              whatsapp: parsed.data.whatsapp,
              store: { create: { slug } },
              subscription: {
                create: {
                  plan: "FREE_TRIAL",
                  status: "TRIALING",
                  currentPeriodEnd: trialEnds,
                },
              },
            },
          },
        },
      });
      created = true;
      break;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }
      throw err;
    }
  }

  if (!created) {
    // All retries collided. Surface as a form error rather than pretending success.
    return {
      ok: false,
      errors: {
        businessName: [
          "Could not allocate a unique storefront URL. Try a slightly different business name.",
        ],
      },
    };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginState = { ok: false; error: string } | undefined;

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true },
  });
  redirect(user?.role === "DEALER" ? "/dashboard" : "/");
}
