import type { Metadata } from "next";
import Link from "next/link";
import { LoginTabs } from "./LoginTabs";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your Wheewise account.</p>
      </div>

      <LoginTabs />

      <div className="border-border-default space-y-1 border-t pt-4 text-sm text-zinc-500">
        <div>
          New here?{" "}
          <Link href="/signup" className="text-brand-red font-medium hover:underline">
            Create account
          </Link>
        </div>
        <div>
          Are you a dealer?{" "}
          <Link
            href="/signup/dealer"
            className="text-brand-red font-medium hover:underline"
          >
            Join Wheewise
          </Link>
        </div>
      </div>
    </div>
  );
}
