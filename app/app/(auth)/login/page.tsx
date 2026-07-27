import type { Metadata } from "next";
import { LoginRoleTabs } from "./LoginRoleTabs";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginRoleTabs />
    </div>
  );
}
