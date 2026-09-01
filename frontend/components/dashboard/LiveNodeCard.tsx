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
    <Card hover className="h-full overflow-hidden">
      <div className="flex items-start justify-between border-b border-[#f1f5f9] bg-white px-4 py-4">
        <Link href={`/nodes/${nodeId}`} className="group min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#0f172a] group-hover:text-[#2563eb]">{nodeId}</span>
            <IconChevronRight size={14} className="text-[#94a3b8] opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="mt-1 truncate text-xs font-medium text-[#64748b]">{name} · {location}</p>
        </Link>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ color: statusColor, borderColor: `${statusColor}30`, backgroundColor: `${statusColor}12` }}>
          <StatusDot color={statusColor} pulse={live} size={6} />
          {statusLabel}
        </span>
      </div>

      {/* big live values — light tiles */}
      <div className="grid grid-cols-3 gap-px bg-[#f1f5f9]">
        {["temperature", "humidity", "aqi"].map((key) => {
          const m = METRIC_MAP[key as MetricKey];
          const value = reading?.data?.[key as MetricKey];
          return (
            <div key={key} className="flex flex-col gap-1.5 bg-white px-3 py-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748b]">{m.short}</span>
              <span className="text-tabular text-xl font-bold leading-none text-[#0f172a]">
                {typeof value === "number" ? value.toFixed(m.precision) : "—"}
              </span>
              <span className="text-xs font-semibold" style={{ color: m.accent }}>{m.unit}</span>
            </div>
          );
        })}
      </div>

      {/* metric selector + sparkline */}
      <div className="border-t border-[#f1f5f9] bg-[#f8fafc] px-3 py-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {METRICS.filter((m) => m.key !== "rain").map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                metric === m.key ? "bg-[#0f172a] text-white shadow-sm" : "bg-white text-[#64748b] ring-1 ring-[#e2e8f0] hover:text-[#0f172a]"
              }`}
            >
              {m.short}
            </button>
          ))}
        </div>
        {spark.loading ? (
          <Skeleton className="h-[86px] w-full" />
        ) : sparkData.length < 2 ? (
          <div className="flex h-[86px] items-center justify-center rounded-xl border border-dashed border-[#e2e8f0] bg-white">
            <p className="text-xs font-medium text-[#94a3b8]">No sparkline data</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#f1f5f9] bg-white p-2">
            <TrendChartView data={sparkData} series={series} height={92} showLegend={false} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#f1f5f9] bg-white px-4 py-2.5 text-xs">
        <span className="font-medium text-[#64748b]">Updated {reading?.timestamp ? timeAgo(reading.timestamp, now) : "—"}</span>
        <span className="flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-1 text-[11px] font-bold text-[#059669] ring-1 ring-[#a7f3d0]">
          <StatusDot color="#059669" size={6} pulse={live} />
          5s interval
        </span>
      </div>
    </Card>
  );
}
