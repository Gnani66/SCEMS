"use client";

import { useMemo, useState } from "react";
import { TrendChartView, type ChartPoint } from "@/components/charts";
import type { SeriesConfig } from "@/components/charts";
import { Card, Skeleton } from "@/components/ui";
import { cn } from "@/lib/format";
import { getReadingsHistory } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useRealtime, type TrendMetric } from "@/providers/realtime";
import { METRIC_MAP, METRICS, type MetricKey, seriesStats } from "@/lib/metrics";

const NODE_COLORS = ["#4ADE80", "#60A5FA", "#A78BFA", "#F5B942", "#F87171", "#34D399"];

/** How many realtime points from the shared WebSocket trend buffer to overlay. */
const TREND_TAIL = 80;

export default function LiveTrendChart({
  nodes,
  defaultMetric = "temperature",
  height = 236,
}: {
  nodes: string[];
  defaultMetric?: MetricKey;
  height?: number;
}) {
  const [metric, setMetric] = useState<MetricKey>(defaultMetric);
  const [node, setNode] = useState<string>("all");
  const meta = METRIC_MAP[metric];
  const { trend } = useRealtime();

  const nodesKey = nodes.join("|");

  const historyQ = useApi(
    () =>
      getReadingsHistory({
        nodeId: node === "all" ? undefined : node,
        hours: 6,
        limit: 400,
      }),
    [node],
  );

  const { chartData, seriesConfig, stats } = useMemo(() => {
    const rows = historyQ.data?.readings ?? [];

    const candidateIds =
      node === "all"
        ? Array.from(
            new Set([...rows.map((r) => r.node_id), ...nodesKey.split("|").filter(Boolean)]),
          )
        : [node];

    const nodeIds = candidateIds.filter((id) => {
      const hasHistory = rows.some((r) => r.node_id === id);
      const hasTrend = (trend[id]?.[metric as TrendMetric]?.length ?? 0) > 0;
      return hasHistory || hasTrend;
    });

    // Merge DB history + the live WebSocket tail into a single series per node.
    const byNode = new Map<string, Map<number, number | null>>();
    const times = new Set<number>();
    for (const id of nodeIds) {
      const map = new Map<number, number | null>();
      for (const row of rows) {
        if (row.node_id !== id) continue;
        const value = (row as unknown as Record<string, unknown>)[metric] as number;
        if (typeof value !== "number") continue;
        const t = new Date(row.timestamp).getTime();
        if (Number.isNaN(t)) continue;
        map.set(t, value);
        times.add(t);
      }
      for (const point of (trend[id]?.[metric as TrendMetric] ?? []).slice(-TREND_TAIL)) {
        map.set(point.time, point.value);
        times.add(point.time);
      }
      byNode.set(id, map);
    }

    const sortedTimes = Array.from(times).sort((a, b) => a - b);
    const chartData = sortedTimes.map((t): ChartPoint => {
      const point: ChartPoint = { time: t };
      for (const id of nodeIds) point[id] = byNode.get(id)?.get(t) ?? null;
      return point;
    });

    const colors = nodeIds.length === 1 ? [NODE_COLORS[0]] : NODE_COLORS;
    const seriesConfig: SeriesConfig[] = nodeIds.map((id, i) => ({
      key: id,
      label: id.replace("SCEMS_NODE_", "NODE ").replace("_0", ""),
      color: colors[i % colors.length],
      unit: meta.unit,
    }));

    const allValues = nodeIds.flatMap((id) =>
      Array.from(byNode.get(id)?.values() ?? []).filter((v): v is number => v != null),
    );
    const stats = seriesStats(allValues);

    return { chartData, seriesConfig, stats };
  }, [historyQ.data, node, nodesKey, trend, metric, meta.unit]);

  return (
    <Card
      className="h-full"
      kicker="Realtime"
      title="Environmental Trends"
      right={
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-ok">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
          LIVE
        </span>
      }
    >
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {METRICS.filter((m) => m.key !== "rain" && m.key !== "pressure").map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  metric === m.key
                    ? "bg-white/[0.09] text-ink"
                    : "text-muted hover:text-secondary",
                )}
              >
                {m.short}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setNode("all")}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                node === "all" ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary",
              )}
            >
              All
            </button>
            {nodes.map((id) => (
              <button
                key={id}
                onClick={() => setNode(id)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  node === id ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary",
                )}
              >
                {id.replace("SCEMS_NODE_", "NODE ")}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="flex gap-4 border-b border-line px-3 py-2 text-[11px] text-secondary">
            <span>MIN <b className="text-tabular text-ink">{stats.min.toFixed(2)}</b></span>
            <span>AVG <b className="text-tabular text-ink">{stats.avg.toFixed(2)}</b></span>
            <span>MAX <b className="text-tabular text-ink">{stats.max.toFixed(2)}</b></span>
            <span className="ml-auto text-muted">{meta.unit}</span>
          </div>
        )}

        <div className="px-3 py-2">
          {historyQ.loading && chartData.length === 0 ? (
            <Skeleton className="h-[180px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[180px] items-center justify-center">
              <p className="text-xs text-muted">No data available</p>
            </div>
          ) : (
            <TrendChartView
              data={chartData}
              series={seriesConfig}
              height={height - 8}
              area
            />
          )}
        </div>
      </div>
    </Card>
  );
}