import type { Role } from "@prisma/client";

/** Where to send a user right after successful sign-in, based on their role. */
export function roleRedirectPath(role: Role | null | undefined): string {
  switch (role) {
    case "DEALER":
      return "/dashboard";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    default:
      return "/browse";
  }
}
