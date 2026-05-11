import "./env";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";
import { verifyOtp } from "./otp";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const otpSchema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, "").slice(-10);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phone: { label: "Phone", type: "tel" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(creds) {
        // Phone OTP flow
        if (creds.phone && creds.otp) {
          const parsed = otpSchema.safeParse(creds);
          if (!parsed.success) return null;

          const valid = await verifyOtp(parsed.data.phone, parsed.data.otp);
          if (!valid) return null;

          const normalized = normalizePhone(parsed.data.phone);
          const existing = await prisma.user.findFirst({
            where: { phone: { contains: normalized } },
            select: { id: true, email: true, name: true, role: true },
          });

          if (existing) {
            return {
              id: existing.id,
              email: existing.email ?? `${normalized}@phone.user`,
              name: existing.name ?? `User ${normalized.slice(-4)}`,
              role: existing.role,
            };
          }

          // Auto-create buyer account for new phone numbers
          const user = await prisma.user.create({
            data: {
              email: `${normalized}@phone.user`,
              phone: normalized,
              passwordHash: "",
              name: `User ${normalized.slice(-4)}`,
              role: "BUYER",
            },
            select: { id: true, email: true, name: true, role: true },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // Email/password flow
        const parsed = credentialsSchema.safeParse(creds);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        if (token.role) session.user.role = token.role;
      }
      return session;
    },
  },
});
