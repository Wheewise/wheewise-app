"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginTabs } from "./LoginTabs";

type UserType = "buyer" | "dealer";

export function LoginRoleTabs() {
  const [userType, setUserType] = useState<UserType>("buyer");

  return (
    <div>
      <div className="mb-6 flex overflow-hidden rounded-xl border border-border-default">
        <button
          type="button"
          onClick={() => setUserType("buyer")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            userType === "buyer"
              ? "bg-brand-red text-white"
              : "bg-surface-muted text-zinc-500 hover:text-foreground"
          }`}
        >
          I&apos;m a Buyer
        </button>
        <button
          type="button"
          onClick={() => setUserType("dealer")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            userType === "dealer"
              ? "bg-brand-red text-white"
              : "bg-surface-muted text-zinc-500 hover:text-foreground"
          }`}
        >
          I&apos;m a Dealer
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {userType === "buyer" ? "Welcome back" : "Dealer sign in"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {userType === "buyer"
            ? "Find your next vehicle."
            : "Manage your inventory and leads."}
        </p>
      </div>

      <div className="mt-6">
        <LoginTabs />
      </div>

      <div className="border-border-default mt-6 border-t pt-4 text-sm text-zinc-500">
        {userType === "buyer" ? (
          <>
            New here?{" "}
            <Link href="/signup" className="text-brand-red font-medium hover:underline">
              Create account
            </Link>
          </>
        ) : (
          <>
            New dealer?{" "}
            <Link
              href="/signup/dealer"
              className="text-brand-red font-medium hover:underline"
            >
              Join Wheewise
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
