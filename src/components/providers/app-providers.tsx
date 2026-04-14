"use client";

import { MotionConfig } from "framer-motion";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { VaultProvider } from "@/components/providers/vault-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <VaultProvider>
          {children}
          <Toaster richColors position="top-right" />
        </VaultProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
