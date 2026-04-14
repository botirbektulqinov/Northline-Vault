"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export function useClipboardCopy(clearAfterSeconds: number) {
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) {
        window.clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  return useCallback(
    async (value: string, label: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);

        if (clearTimerRef.current) {
          window.clearTimeout(clearTimerRef.current);
          clearTimerRef.current = null;
        }

        if (clearAfterSeconds > 0) {
          clearTimerRef.current = window.setTimeout(async () => {
            try {
              await navigator.clipboard.writeText("");
            } catch {
              // Browser permissions can block delayed writes; ignore quietly.
            }
          }, clearAfterSeconds * 1000);
        }
      } catch {
        toast.error(`Couldn't copy ${label.toLowerCase()}.`);
      }
    },
    [clearAfterSeconds],
  );
}
