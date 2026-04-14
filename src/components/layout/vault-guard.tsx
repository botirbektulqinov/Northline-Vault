"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { FullPageLoader } from "@/components/shared/full-page-loader";
import { useVault } from "@/hooks/use-vault";
import { buildLockHref } from "@/lib/routes";

export function VaultGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isReady } = useVault();

  useEffect(() => {
    if (status === "locked") {
      const currentPath =
        typeof window === "undefined"
          ? pathname
          : `${window.location.pathname}${window.location.search}`;
      router.replace(buildLockHref(currentPath));
    }
  }, [pathname, router, status]);

  if (!isReady || status === "unlocking" || status === "locked") {
    return <FullPageLoader />;
  }

  if (status !== "unlocked") {
    return <FullPageLoader />;
  }

  return <>{children}</>;
}
