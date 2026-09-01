"use client";

import { Card, EmptyState } from "@/components/ui";
import { METRICS, METRIC_MAP, type MetricKey } from "@/lib/metrics";

export type AggregateData = Partial<Record<MetricKey, number | boolean>>;

/**
 * Campus-wide environmental data — Zoho white KPI tiles
 */
export default function EnvironmentalMetrics({
  data,
  statusText,
}: {
  data: AggregateData;
  statusText?: string;
}) {
  const values = Object.values(data).filter((v) => v != null);

  return (
    <Card
      className="h-full"
      kicker="Campus average"
      title="Environmental Data"
      right={
        statusText && (
          <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-medium text-[#64748b] ring-1 ring-[#e2e8f0]">
            {statusText}
          </span>
        )
      }
    >
      {values.length === 0 ? (
        <EmptyState message="No live data" sub="Waiting for sensor nodes to report" />
      ) : (
        <div className="grid grid-cols-2 gap-px bg-[#f1f5f9] sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
          {METRICS.map((meta) => {
            const raw = data[meta.key];
            if (raw == null) return null;
            const display =
              meta.key === "rain" ? (raw ? "Yes" : "No") : (raw as number).toFixed(meta.precision);
            const pct =
              meta.key === "rain"
                ? raw
                  ? 100
                  : 0
                : Math.min(((raw as number) / meta.rangeMax) * 100, 100);

            return (
              <div
                key={meta.key}
                className="group flex min-w-0 flex-col gap-2 bg-white p-4 transition-all hover:bg-[#f8fafc]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
                    {meta.short}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: meta.accent }}
                  />
                </div>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-tabular text-[22px] font-bold leading-none tracking-tight text-[#0f172a]">
                    {display}
                  </span>
                  {meta.key !== "rain" && meta.unit && (
                    <span className="text-[11px] font-medium text-[#64748b]">{meta.unit}</span>
                  )}
                </span>
                <span className="text-[11px] font-medium" style={{ color: meta.accent }}>
                  {meta.label}
                </span>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: meta.accent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export { METRIC_MAP };
