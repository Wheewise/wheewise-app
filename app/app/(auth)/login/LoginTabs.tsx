"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { OtpLoginForm } from "./OtpLoginForm";

export function LoginTabs() {
  const [tab, setTab] = useState<"email" | "otp">("email");

  return (
    <div>
      <div className="mb-6 flex border-b">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            tab === "email"
              ? "text-brand-red border-brand-red border-b-2"
              : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => setTab("otp")}
          className={`flex-1 pb-3 text-sm font-medium transition-colors ${
            tab === "otp"
              ? "text-brand-red border-brand-red border-b-2"
              : "border-b-2 border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Phone OTP
        </button>
      </div>
      {tab === "email" ? <LoginForm /> : <OtpLoginForm />}
    </div>
  );
}
