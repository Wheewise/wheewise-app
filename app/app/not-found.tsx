import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 text-center">
      <Logo variant="wordmark" size={32} href="/" />
      <h1 className="mt-8 text-4xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The link you followed may be broken, or the listing may have been
        removed by the dealer.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark"
        >
          Back home
        </Link>
        <Link
          href="/browse"
          className="rounded-md border border-border-default bg-background px-4 py-2 text-sm font-semibold hover:bg-surface-muted"
        >
          Browse vehicles
        </Link>
      </div>
    </div>
  );
}
