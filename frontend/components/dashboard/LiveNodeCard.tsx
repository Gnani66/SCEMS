"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendChartView, type SeriesConfig } from "@/components/charts";
import { Card, Skeleton, StatusDot } from "@/components/ui";
import { IconChevronRight } from "@/components/icons";
import { useNow } from "@/hooks/useNow";
import { getReadingsHistory } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { METRICS, METRIC_MAP, type MetricKey } from "@/lib/metrics";
import { timeAgo } from "@/lib/format";
import type { SensorReading } from "@/types/scems";

export default function LiveNodeCard({
  nodeId,
  name,
  location,
  reading,
  statusColor,
  statusLabel,
  live,
}: {
  nodeId: string;
  name: string;
  location: string;
  reading: SensorReading | null;
  statusColor: string;
  statusLabel: string;
  live: boolean;
}) {
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const now = useNow(1000);
  const meta = METRIC_MAP[metric];

  const spark = useApi(
    () => getReadingsHistory({ nodeId, hours: 6, limit: 200 }),
    [nodeId],
  );

  const sparkData = (spark.data?.readings ?? [])
    .map((r) => ({
      time: new Date(r.timestamp).getTime(),
      [nodeId]: (r as unknown as Record<string, unknown>)[metric] as number,
    }))
    .filter((p) => !Number.isNaN(p.time) && p[nodeId] != null)
    .slice(-120);

  const series: SeriesConfig[] = [
    { key: nodeId, label: nodeId.replace("SCEMS_NODE_", "NODE "), color: meta.accent, unit: meta.unit },
  ];

  return (
    <Card hover className="h-full">
      <div className="flex items-start justify-between border-b border-line px-4 py-3">
        <Link href={`/nodes/${nodeId}`} className="group min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[13px] font-semibold text-ink group-hover:text-info">{nodeId}</span>
            <IconChevronRight size={12} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted">{name} · {location}</p>
        </Link>
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold" style={{ color: statusColor }}>
          <StatusDot color={statusColor} pulse={live} size={6} />
          {statusLabel}
        </span>
      </div>

      {/* big live values */}
      <div className="grid grid-cols-3 gap-px bg-line/40">
        {["temperature", "humidity", "aqi"].map((key) => {
          const m = METRIC_MAP[key as MetricKey];
          const value = reading?.data?.[key as MetricKey];
          return (
            <div key={key} className="flex flex-col gap-1 bg-card px-3 py-3">
              <span className="text-[9px] uppercase tracking-wider text-muted">{m.short}</span>
              <span className="text-tabular text-xl font-semibold leading-none text-ink">
                {typeof value === "number" ? value.toFixed(m.precision) : "—"}
              </span>
              <span className="text-[10px]" style={{ color: m.accent }}>{m.unit}</span>
            </div>
          );
        })}
      </div>

      {/* metric selector + sparkline */}
      <div className="border-t border-line px-3 pt-2">
        <div className="mb-1 flex flex-wrap gap-1">
          {METRICS.filter((m) => m.key !== "rain").map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                metric === m.key ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary"
              }`}
            >
              {m.short}
            </button>
          ))}
        </div>
        {spark.loading ? (
          <Skeleton className="h-[86px] w-full" />
        ) : sparkData.length < 2 ? (
          <div className="flex h-[86px] items-center justify-center">
            <p className="text-[11px] text-muted">No data available</p>
          </div>
        ) : (
          <TrendChartView data={sparkData} series={series} height={92} showLegend={false} />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-muted">
        <span>Updated {reading?.timestamp ? timeAgo(reading.timestamp, now) : "—"}</span>
        <span className="flex items-center gap-1.5">
          <StatusDot color="#4ADE80" size={6} pulse={live} />
          5s interval
        </span>
      </div>
    </Card>
  );
}