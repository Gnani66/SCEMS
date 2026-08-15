"use client";

import { Card, EmptyState } from "@/components/ui";
import { METRICS, METRIC_MAP, type MetricKey } from "@/lib/metrics";

export type AggregateData = Partial<Record<MetricKey, number | boolean>>;

/**
 * Campus-wide environmental data panel. Aggregated average of the
 * actual node readings received from the backend / WebSocket.
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
          <span className="text-[11px] text-muted">{statusText}</span>
        )
      }
    >
      {values.length === 0 ? (
        <EmptyState message="No data available" />
      ) : (
        <div className="grid grid-cols-2 gap-x-px gap-y-px bg-line/40 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-10">
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
                className="flex min-w-0 flex-col gap-1.5 bg-card p-3 transition-colors hover:bg-card2"
              >
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">
                  {meta.short}
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-tabular text-lg font-semibold leading-none text-ink">
                    {display}
                  </span>
                  {meta.key !== "rain" && meta.unit && (
                    <span className="text-[10px] text-secondary">{meta.unit}</span>
                  )}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted">
                  <span className="text-xs" style={{ color: meta.accent }}>{meta.label}</span>
                </span>
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-line2">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
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