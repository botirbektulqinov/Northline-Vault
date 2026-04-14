import { LoaderCircle, ShieldCheck } from "lucide-react";

export function FullPageLoader({
  title = "Preparing your vault",
  description = "Checking vault metadata and waiting for the secure client session.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-canvas)] px-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-black/5">
          <ShieldCheck className="size-7 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <LoaderCircle className="size-4 animate-spin" />
          Secure client boot in progress
        </div>
      </div>
    </div>
  );
}
