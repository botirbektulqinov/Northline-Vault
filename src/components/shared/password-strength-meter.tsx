"use client";

import { motion } from "framer-motion";

import { STRENGTH_COPY } from "@/lib/constants/vault";
import { evaluatePasswordStrength } from "@/lib/passwords";
import { cn } from "@/lib/utils";

const WIDTH_BY_STRENGTH = {
  WEAK: "33%",
  FAIR: "66%",
  STRONG: "100%",
} as const;

const COLOR_BY_STRENGTH = {
  WEAK: "bg-[#9b4b3d]",
  FAIR: "bg-[#8a6a2b]",
  STRONG: "bg-[#2f6f55]",
} as const;

export function PasswordStrengthMeter({
  password,
  compact = false,
}: {
  password: string;
  compact?: boolean;
}) {
  const strength = evaluatePasswordStrength(password);
  const details = STRENGTH_COPY[strength.value];
  const barWidth = password
    ? WIDTH_BY_STRENGTH[strength.value]
    : "0%";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{details.label}</span>
        {!compact ? (
          <span className="text-muted-foreground">{details.description}</span>
        ) : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className={cn("h-full rounded-full", COLOR_BY_STRENGTH[strength.value])}
          animate={{ width: barWidth }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
      {!compact ? (
        <p className="text-sm text-muted-foreground">{strength.feedback}</p>
      ) : null}
    </div>
  );
}
