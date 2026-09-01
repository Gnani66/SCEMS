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

const NODE_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

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
      kicker="Realtime streaming"
      title="Environmental Trends"
      right={
        <span className="flex items-center gap-1.5 rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#059669]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" style={{ animation: "pulse-ring 1.8s ease-out infinite" }} />
          LIVE
        </span>
      }
    >
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f5f9] bg-[#f8fafc] px-4 py-2.5">
          <div className="flex flex-wrap gap-1">
            {METRICS.filter((m) => m.key !== "rain" && m.key !== "pressure").map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  metric === m.key
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "bg-white text-[#64748b] ring-1 ring-[#e2e8f0] hover:text-[#0f172a] hover:ring-[#cbd5e1]",
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
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                node === "all" ? "bg-[#0f172a] text-white shadow-sm" : "bg-white text-[#64748b] ring-1 ring-[#e2e8f0] hover:text-[#0f172a]",
              )}
            >
              All nodes
            </button>
            {nodes.map((id) => (
              <button
                key={id}
                onClick={() => setNode(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  node === id ? "bg-[#0f172a] text-white shadow-sm" : "bg-white text-[#64748b] ring-1 ring-[#e2e8f0] hover:text-[#0f172a]",
                )}
              >
                {id.replace("SCEMS_NODE_", "N")}
              </button>
            ))}
          </div>
        </div>

        {stats && (
          <div className="flex gap-4 border-b border-[#f1f5f9] px-4 py-2.5 text-xs">
            <span className="text-[#64748b]">MIN <b className="text-tabular font-bold text-[#0f172a]">{stats.min.toFixed(2)}</b></span>
            <span className="text-[#64748b]">AVG <b className="text-tabular font-bold text-[#2563eb]">{stats.avg.toFixed(2)}</b></span>
            <span className="text-[#64748b]">MAX <b className="text-tabular font-bold text-[#0f172a]">{stats.max.toFixed(2)}</b></span>
            <span className="ml-auto rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[11px] font-medium text-[#64748b]">{meta.unit}</span>
          </div>
        )}

        <div className="px-4 py-4">
          {historyQ.loading && chartData.length === 0 ? (
            <Skeleton className="h-[180px] w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc]">
              <p className="text-sm font-medium text-[#64748b]">No trend data yet</p>
              <p className="text-xs text-[#94a3b8]">Connect a node to see live trends</p>
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
