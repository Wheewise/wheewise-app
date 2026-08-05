import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

/**
 * Page/layout-level guard for the /admin section. Distinct from the
 * private, throw-based requireAdmin() in lib/actions/admin.ts, which
 * protects server actions (where throwing, not redirecting, is the right
 * failure mode) — same name, different file, different job.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !ADMIN_ROLES.has(session.user.role)) {
    redirect("/");
  }
  return session.user;
}
