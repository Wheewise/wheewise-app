"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/dealers", label: "Dealers" },
  { href: "/admin/buyers", label: "Buyers" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
  { href: "/admin/inspectors", label: "Inspectors" },
  { href: "/admin/inspections", label: "Inspections" },
  { href: "/admin/community", label: "Community" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/templates", label: "Templates" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#E8192C]/15 text-[#E8192C]"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
