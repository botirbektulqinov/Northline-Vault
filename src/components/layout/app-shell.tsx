"use client";

import {
  LayoutGrid,
  Lock,
  Menu,
  Plus,
  Settings,
  ShieldEllipsis,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppLogo } from "@/components/shared/app-logo";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useVault } from "@/hooks/use-vault";
import { buildLockHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/vault",
    label: "Vault overview",
    icon: LayoutGrid,
  },
  {
    href: "/vault/new",
    label: "Add credential",
    icon: Plus,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function ShellNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/vault"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-white/72 hover:bg-white/6 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/vault/new")) {
    return "Add credential";
  }
  if (pathname.includes("/edit")) {
    return "Edit credential";
  }
  if (pathname.startsWith("/settings")) {
    return "Settings";
  }
  return "Vault overview";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { lock, health, vault } = useVault();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const getCurrentPath = useCallback(() => {
    if (typeof window === "undefined") {
      return pathname;
    }

    return `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

  useEffect(() => {
    const handleHotkeys = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.getAttribute("contenteditable") === "true";

      if (isTyping) {
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        router.push("/vault/new");
      }
    };

    window.addEventListener("keydown", handleHotkeys);
    return () => window.removeEventListener("keydown", handleHotkeys);
  }, [router]);

  const title = getPageTitle(pathname);

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[268px_1fr]">
        <aside className="hidden min-h-screen flex-col border-r border-white/10 bg-[var(--app-sidebar)] px-5 py-5 text-white lg:flex">
          <AppLogo className="text-white" tone="inverse" />
          <div className="mt-8">
            <ShellNav pathname={pathname} />
          </div>
          <div className="mt-auto space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/6 p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/10">
                  <ShieldEllipsis className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Security Health</p>
                  <p className="text-xs text-white/70">{health.score}/100 current score</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/72">
                {health.reusedEntries > 0
                  ? `${health.reusedEntries} entries still reuse passwords.`
                  : "No reused passwords are currently flagged."}
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2 bg-white text-[var(--app-sidebar)] hover:bg-white/90"
              onClick={() => {
                lock();
                router.push(buildLockHref(getCurrentPath()));
              }}
            >
              <Lock className="size-4" />
              Lock vault
            </Button>
          </div>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-black/6 bg-[color:rgba(245,244,239,0.92)] backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <div className="flex items-center gap-3">
                <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="lg:hidden"
                        aria-label="Open navigation"
                      />
                    }
                  >
                      <Menu className="size-4" />
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[280px] border-r-0 bg-[var(--app-sidebar)] px-5 py-5 text-white"
                  >
                    <AppLogo className="text-white" tone="inverse" />
                    <Separator className="my-5 bg-white/10" />
                    <ShellNav
                      pathname={pathname}
                      onNavigate={() => setMobileNavOpen(false)}
                    />
                    <div className="mt-8">
                      <Button
                        variant="secondary"
                        className="w-full justify-start gap-2 bg-white text-[var(--app-sidebar)] hover:bg-white/90"
                        onClick={() => {
                          lock();
                          setMobileNavOpen(false);
                          router.push(buildLockHref(getCurrentPath()));
                        }}
                      >
                        <Lock className="size-4" />
                        Lock vault
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Northline Vault
                  </p>
                  <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right text-sm sm:block">
                  <p className="max-w-[240px] truncate font-medium">
                    {vault?.name ? `${vault.name} · ` : ""}
                    {vault?.credentialCount ?? 0} credentials
                  </p>
                  <p className="text-muted-foreground">
                    {health.staleEntries > 0
                      ? `${health.staleEntries} need rotation review`
                      : "No rotation backlog flagged"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push("/vault/new")}
                >
                  <Plus className="size-4" />
                  Quick add
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  );
}
