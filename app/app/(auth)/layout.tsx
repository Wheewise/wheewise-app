import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <div className="mb-8">
        <Logo size={36} />
      </div>
      <div className="w-full max-w-md rounded-xl border border-border-default bg-background p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}
