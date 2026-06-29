import Link from "next/link";

export default function HackathonPage() {
  return (
    <div className="bg-surface-muted min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="bg-brand-red inline-block rounded-full px-4 py-1 text-xs font-bold tracking-wider text-white uppercase">
          Coming soon
        </span>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Wheewise Hackathon 2026
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Build the future of India&apos;s pre-owned vehicle marketplace.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="border-border-default bg-background rounded-lg border p-6">
            <div className="text-brand-red text-3xl font-bold">₹5L</div>
            <div className="mt-1 text-sm font-semibold">Prize pool</div>
            <p className="mt-1 text-xs text-zinc-500">
              Cash prizes for the top 3 teams plus mentorship.
            </p>
          </div>
          <div className="border-border-default bg-background rounded-lg border p-6">
            <div className="text-brand-red text-3xl font-bold">48h</div>
            <div className="mt-1 text-sm font-semibold">Virtual hackathon</div>
            <p className="mt-1 text-xs text-zinc-500">
              Build remotely, present live. Open to all developers in India.
            </p>
          </div>
          <div className="border-border-default bg-background rounded-lg border p-6">
            <div className="text-brand-red text-3xl font-bold">3</div>
            <div className="mt-1 text-sm font-semibold">Tracks</div>
            <p className="mt-1 text-xs text-zinc-500">
              AI/ML for auto, Dealer tools, Consumer experience.
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <h2 className="text-xl font-bold">Tracks</h2>
          <div className="border-border-default bg-background grid gap-4 rounded-lg border p-6 text-left sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold">AI/ML for Auto</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Build price prediction models, damage detection from photos, or automated
                vehicle valuation tools using our open dataset.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Dealer Tools</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Create tools that help dealers manage inventory, generate descriptions,
                qualify leads, or optimize pricing.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Consumer Experience</h3>
              <p className="mt-1 text-xs text-zinc-500">
                Reimagine how buyers discover, compare, and purchase pre-owned vehicles.
                Build on our public API.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold">Timeline</h2>
          <div className="border-border-default bg-background mt-4 rounded-lg border p-6">
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="bg-brand-red shrink-0 rounded px-3 py-1 text-xs font-bold text-white">
                  Jun 15
                </span>
                <span>Registrations open</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-brand-red shrink-0 rounded px-3 py-1 text-xs font-bold text-white">
                  Jul 20
                </span>
                <span>Registrations close · Team formation deadline</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-brand-red shrink-0 rounded px-3 py-1 text-xs font-bold text-white">
                  Aug 1-2
                </span>
                <span>48-hour hackathon weekend</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="bg-brand-red shrink-0 rounded px-3 py-1 text-xs font-bold text-white">
                  Aug 8
                </span>
                <span>Winners announced · Demo day</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link
            href="/community"
            className="bg-brand-red hover:bg-brand-red-dark inline-block rounded-md px-8 py-3 text-sm font-bold text-white"
          >
            Join the community →
          </Link>
          <p className="mt-3 text-xs text-zinc-500">
            Registration opens June 15. Follow the community for updates.
          </p>
        </div>
      </div>
    </div>
  );
}
