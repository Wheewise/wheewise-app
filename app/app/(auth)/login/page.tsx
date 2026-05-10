import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

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
      <LoginForm />
      <div className="border-t border-border-default pt-4 text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup/dealer" className="font-medium text-brand-red hover:underline">
          Join as a dealer
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="font-medium text-brand-red hover:underline">
          sign up as a buyer
        </Link>
        .
      </div>
    </div>
  );
}
