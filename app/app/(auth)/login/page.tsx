import Link from "next/link";
import type { Metadata } from "next";
import { LoginTabs } from "./LoginTabs";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Welcome back. Manage your inventory and leads.
        </p>
      </div>
      <LoginTabs />
      <div className="border-border-default border-t pt-4 text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup/dealer"
          className="text-brand-red font-medium hover:underline"
        >
          Join as a dealer
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="text-brand-red font-medium hover:underline">
          sign up as a buyer
        </Link>
        .
      </div>
    </div>
  );
}
