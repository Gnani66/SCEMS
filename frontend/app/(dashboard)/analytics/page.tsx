"use client";

import { useMemo, useState } from "react";
import { BarChartView } from "@/components/charts";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { getAnalyticsComparison, getAnalyticsSummary } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { cn } from "@/lib/format";
import type { AnalyticsSummary } from "@/types/scems";

const RANGES = [
  { label: "6 Hours", hours: 6 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days", hours: 168 },
];

const SUMMARY_COLS: Array<{
  key: keyof Pick<AnalyticsSummary, "avg_temperature" | "min_temperature" | "max_temperature" | "avg_humidity" | "min_humidity" | "max_humidity" | "avg_aqi" | "min_aqi" | "max_aqi">;
  label: string;
}> = [
  { key: "avg_temperature", label: "AVG TEMP" },
  { key: "min_temperature", label: "MIN TEMP" },
  { key: "max_temperature", label: "MAX TEMP" },
  { key: "avg_humidity", label: "AVG HUMIDITY" },
  { key: "min_humidity", label: "MIN HUMIDITY" },
  { key: "max_humidity", label: "MAX HUMIDITY" },
  { key: "avg_aqi", label: "AVG AQI" },
  { key: "min_aqi", label: "MIN AQI" },
  { key: "max_aqi", label: "MAX AQI" },
];

const COMPARE_METRICS: Array<{
  label: string;
  key: "avg_temperature" | "avg_humidity" | "avg_aqi" | "avg_light" | "avg_sound" | "avg_uv";
  unit: string;
  precision: number;
}> = [
  { label: "Temperature", key: "avg_temperature", unit: "°C", precision: 1 },
  { label: "Humidity", key: "avg_humidity", unit: "%", precision: 1 },
  { label: "AQI", key: "avg_aqi", unit: "", precision: 1 },
  { label: "Light", key: "avg_light", unit: "lx", precision: 0 },
  { label: "Sound", key: "avg_sound", unit: "dB", precision: 1 },
  { label: "UV", key: "avg_uv", unit: "", precision: 2 },
];

const NODE_COLORS = ["#4ADE80", "#60A5FA", "#A78BFA", "#F5B942"];

function fmt(value: unknown, precision: number): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(precision)
    : "—";
}

export default function AnalyticsPage() {
  const { nodes } = useLiveNodes();
  const [hours, setHours] = useState(24);

  const comparison = useApi(() => getAnalyticsComparison({ hours }), [hours]);

  const summaries = useApi(
    () =>
      Promise.all(
        nodes.map((n) =>
          getAnalyticsSummary({ nodeId: n.node_id, hours }).catch(() => null),
        ),
      ),
    [nodes.map((n) => n.node_id).join(","), hours],
  );

  const summaryByNode = useMemo(() => {
    const map: Record<string, AnalyticsSummary | null> = {};
    nodes.forEach((n, i) => {
      map[n.node_id] = (summaries.data ?? [])[i] ?? null;
    });
    return map;
  }, [summaries.data, nodes]);

  const compareData = useMemo(() => {
    const routeRows = comparison.data?.nodes ?? [];
    const nodeIds = routeRows.map((r) => r.node_id);
    return COMPARE_METRICS.map((m) => {
      const point: Record<string, string | number | null> = { name: m.label };
      for (const id of nodeIds) {
        point[id] = routeRows.find((r) => r.node_id === id)?.[m.key] ?? null;
      }
      return point;
    });
  }, [comparison.data]);

  const compareSeries = (comparison.data?.nodes ?? []).map((row, i) => ({
    key: row.node_id,
    label: row.node_id.replace("SCEMS_NODE_", "NODE ").replace("_0", ""),
    color: NODE_COLORS[i % NODE_COLORS.length],
    unit: "",
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">Analytics</h1>
          <p className="mt-1 text-[12px] text-muted">
            Per-node statistics and cross-node environmental comparison
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-line bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setHours(r.hours)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                hours === r.hours ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="xl:col-span-7">
          <Card kicker={`Past ${hours}h`} title="Summary Statistics" dense>
            {nodes.length === 0 ? (
              <EmptyState message="No data available" />
            ) : (
              <div className="flex flex-col gap-px bg-line/40">
                {nodes.map((n) => {
                  const s = summaryByNode[n.node_id];
                  return (
                    <div key={n.node_id} className="bg-card p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[12px] font-semibold text-ink">{n.node_id}</span>
                        <span className="text-[10px] text-muted">{n.location}</span>
                        {s && (
                          <span className="ml-auto text-[10px] text-muted">
                            {s.reading_count?.toLocaleString?.() ?? "—"} readings
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-line/40 sm:grid-cols-9">
                        {SUMMARY_COLS.map((col) => (
                          <div key={col.key} className="flex flex-col gap-0.5 bg-card2 px-2.5 py-2">
                            <span className="text-[9px] uppercase tracking-wider text-muted">{col.label}</span>
                            <span className="text-tabular text-[12px] font-medium text-ink">
                              {s ? fmt(s[col.key], 1) : "—"}
                              {col.key.includes("temperature") ? "°" : col.key.includes("humidity") ? "%" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        {/* Per metric stat rows */}
        <section className="xl:col-span-5">
          <Card kicker="Per-node" title="Metric Averages" dense>
            {comparison.loading ? (
              <div className="p-3"><Skeleton lines={5} /></div>
            ) : !comparison.data?.nodes.length ? (
              <EmptyState message="No data available" />
            ) : (
              <div className="flex flex-col">
                {COMPARE_METRICS.map((m) => {
                  const rows = (comparison.data!.nodes ?? []).map((row, i) => ({
                    label: row.node_id.replace("SCEMS_NODE_", "NODE ").replace("_0", ""),
                    color: NODE_COLORS[i % NODE_COLORS.length],
                    value: fmt(row[m.key], m.precision),
                    unit: m.unit,
                  }));
                  return (
                    <div key={m.key} className="border-b border-line/60 px-3 py-2.5 last:border-b-0">
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>{m.label}</span>
                        <span className="flex items-center gap-2">
                          {rows.map((r) => (
                            <span key={r.label} className="flex items-center gap-1">
                              <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: r.color }} />
                              <b className="text-tabular text-[12px] font-medium text-ink">
                                {r.value} <span className="font-normal text-muted">{r.unit}</span>
                              </b>
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* Comparison chart */}
      <section>
        <Card kicker="Node comparison" title="Average Comparison" dense>
          {errorState(comparison.error, comparison.reload)}
          {comparison.loading && !compareData.length ? (
            <div className="p-3"><Skeleton className="h-[260px] w-full" /></div>
          ) : compareData.length ? (
            <div className="p-2">
              <BarChartView data={compareData as never} series={compareSeries} height={280} xKey="name" />
            </div>
          ) : (
            !comparison.error && <EmptyState message="No data available" />
          )}
        </Card>
      </section>
    </div>
  );
}

function errorState(error: string | null, reload: () => void) {
  return error ? <ErrorState message="Unable to load comparison" onRetry={reload} /> : null;
}