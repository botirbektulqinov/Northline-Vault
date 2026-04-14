import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function AppLogo({
  className,
  compact = false,
  tone = "default",
}: {
  className?: string;
  compact?: boolean;
  tone?: "default" | "inverse";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck className="size-5" />
      </div>
      <div className={cn("space-y-0.5", compact && "hidden sm:block")}>
        <p className="text-sm font-semibold tracking-tight">Northline Vault</p>
        <p
          className={cn(
            "text-xs",
            tone === "inverse" ? "text-white/70" : "text-muted-foreground",
          )}
        >
          Shared credentials, encrypted client-side
        </p>
      </div>
    </div>
  );
}
