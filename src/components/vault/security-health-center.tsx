"use client";

import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import type { SecuritySummary } from "@/lib/types";

const ICON_BY_TONE = {
  good: CheckCircle2,
  warning: AlertTriangle,
  critical: ShieldAlert,
} as const;

const CLASS_BY_TONE = {
  good: "border-[#d9e8df] bg-[#f4faf6] text-[#2f6f55]",
  warning: "border-[#eadfc8] bg-[#fdf8f0] text-[#8a6a2b]",
  critical: "border-[#ead0ca] bg-[#fff5f3] text-[#9b4b3d]",
} as const;

export function SecurityHealthCenter({ health }: { health: SecuritySummary }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Security Health Center
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              Strength distribution and hygiene signals
            </h2>
          </div>
          <Badge variant="secondary" className="rounded-md px-3 py-1 text-xs">
            Score {health.score}/100
          </Badge>
        </div>
        <div className="mt-6 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={health.strengthChartData} barCategoryGap={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e9e6df" vertical={false} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(34, 34, 34, 0.04)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </p>
            <p className="mt-2 text-2xl font-semibold">{health.total}</p>
          </div>
          <div className="rounded-lg bg-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Reused
            </p>
            <p className="mt-2 text-2xl font-semibold">{health.reusedEntries}</p>
          </div>
          <div className="rounded-lg bg-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Missing context
            </p>
            <p className="mt-2 text-2xl font-semibold">{health.missingClassification}</p>
          </div>
          <div className="rounded-lg bg-secondary px-4 py-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Rotation due
            </p>
            <p className="mt-2 text-2xl font-semibold">{health.staleEntries}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black/6 bg-card p-5 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Actionable recommendations
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">
            What to fix next
          </h2>
        </div>
        <div className="mt-6 space-y-3">
          {health.recommendations.map((recommendation) => {
            const Icon = ICON_BY_TONE[recommendation.tone];

            return (
              <div
                key={recommendation.id}
                className={`rounded-xl border px-4 py-4 ${CLASS_BY_TONE[recommendation.tone]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-white/80 p-2">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="font-medium">{recommendation.title}</p>
                    <p className="mt-1 text-sm leading-6 opacity-90">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
