"use client";

import { useMemo, useState } from "react";
import { TrendChartView, type ChartPoint, type SeriesConfig } from "@/components/charts";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { getReadingsHistory } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { METRICS, METRIC_MAP, seriesStats, type MetricKey } from "@/lib/metrics";
import { cn } from "@/lib/format";
import type { FlatReading } from "@/types/scems";

const RANGES = [
  { label: "1 Hour", hours: 1 },
  { label: "6 Hours", hours: 6 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days", hours: 168 },
];

const NODE_COLORS = ["#4ADE80", "#60A5FA", "#A78BFA", "#F5B942"];

export default function HistoryPage() {
  const { nodes: liveNodes } = useLiveNodes();
  const [node, setNode] = useState<string>("all");
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const [range, setRange] = useState(24);

  const meta = METRIC_MAP[metric];

  const { data, loading, error, reload } = useApi(
    () => getReadingsHistory({ nodeId: node === "all" ? undefined : node, hours: range, limit: 1200 }),
    [node, range],
  );

  const { chartData, series, stats } = useMemo(() => {
    const rows = (data?.readings ?? []) as FlatReading[];
    const nodeIds = node === "all"
      ? Array.from(new Set(rows.map((r) => r.node_id))).sort()
      : [node];

    const perNode = new Map<string, Map<number, number>>();
    let min = Infinity;
    let max = -Infinity;
    for (const id of nodeIds) {
      const map = new Map<number, number>();
      for (const row of rows) {
        if (row.node_id !== id) continue;
        const t = new Date(row.timestamp).getTime();
        if (Number.isNaN(t)) continue;
        const v = row[metric] as number;
        if (typeof v !== "number" || Number.isNaN(v)) continue;
        map.set(t, v);
        if (t < min) min = t;
        if (t > max) max = t;
      }
      perNode.set(id, map);
    }

    const times = Array.from(perNode.values())
      .flatMap((m) => Array.from(m.keys()))
      .sort((a, b) => a - b);

    // Downsample long ranges to a readable ~500 points.
    const step = Math.max(1, Math.ceil(times.length / 500));
    const sampled = times.filter((_, i) => i % step === 0);

    const chartData = sampled.map((t): ChartPoint => {
      const point: ChartPoint = { time: t };
      for (const id of nodeIds) point[id] = perNode.get(id)?.get(t) ?? null;
      return point;
    });

    const series: SeriesConfig[] = nodeIds.map((id, i) => ({
      key: id,
      label: id.replace("SCEMS_NODE_", "NODE ").replace("_0", ""),
      color: NODE_COLORS[i % NODE_COLORS.length],
      unit: meta.unit,
    }));

    const allValues = Array.from(perNode.values()).flatMap((m) => Array.from(m.values()));
    const stats = seriesStats(allValues);
    return { chartData, series, stats, span: max - min };
  }, [data, node, metric, meta.unit]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">History</h1>
          <p className="mt-1 text-[12px] text-muted">
            Historical environmental analysis by node, metric and time range
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5">
        <label className="flex items-center gap-2 text-[11px] text-muted">
          Node
          <select
            value={node}
            onChange={(e) => setNode(e.target.value)}
            className="rounded-md border border-line bg-card2 px-2 py-1.5 text-[12px] text-ink outline-none focus:border-line2"
          >
            <option value="all">All Nodes</option>
            {liveNodes.map((n) => (
              <option key={n.node_id} value={n.node_id}>{n.node_id}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-[11px] text-muted">
          Metric
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="rounded-md border border-line bg-card2 px-2 py-1.5 text-[12px] text-ink outline-none focus:border-line2"
          >
            {METRICS.filter((m) => m.key !== "rain").map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.hours}
              onClick={() => setRange(r.hours)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                range === r.hours ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          ["Readings", data ? data.readings.length.toLocaleString() : "—", "#929797"],
          ["Minimum", stats ? stats.min.toFixed(2) : "—", "#60A5FA"],
          ["Average", stats ? stats.avg.toFixed(2) : "—", "#4ADE80"],
          ["Maximum", stats ? stats.max.toFixed(2) : "—", "#EF4444"],
          ["Window", `${range}h`, "#929797"],
          ["Unit", meta.unit || "—", "#929797"],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-line bg-card px-3 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-muted">{label}</p>
            <p className="text-tabular text-[15px] font-semibold mt-0.5" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <Card kicker={meta.label} title={`${meta.label} — ${METRIC_MAP[metric].short}`} dense>
        {error ? (
          <ErrorState message="Unable to load history" onRetry={reload} />
        ) : loading ? (
          <div className="p-3"><Skeleton className="h-[320px] w-full" /></div>
        ) : chartData.length < 2 ? (
          <EmptyState message="No data available" sub="Try a different node, metric or time range" />
        ) : (
          <div className="p-2">
            <TrendChartView data={chartData} series={series} height={340} area={node === "all"} />
          </div>
        )}
      </Card>
    </div>
  );
}