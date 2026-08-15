"use client";

import Link from "next/link";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useNow } from "@/hooks/useNow";
import { Card, EmptyState, ErrorState, Skeleton, StatusDot } from "@/components/ui";
import { IconChevronRight } from "@/components/icons";
import { timeAgo } from "@/lib/format";

export default function NodeWatchlist() {
  const { nodes, loading, error, reload } = useLiveNodes();
  const now = useNow(1000);

  return (
    <Card
      className="h-full"
      kicker="Campus deployment"
      title="Node Watchlist"
      right={
        <span className="text-[11px] text-muted">
          {nodes.length} node{nodes.length === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
              <th className="px-3 py-2 font-medium">Node</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-2 py-2 text-right font-medium">AQI</th>
              <th className="px-2 py-2 text-right font-medium">Temp</th>
              <th className="px-2 py-2 text-right font-medium">Humidity</th>
              <th className="px-2 py-2 text-right font-medium">Sound</th>
              <th className="px-2 py-2 text-right font-medium">UV</th>
              <th className="px-3 py-2 text-right font-medium">Last update</th>
            </tr>
          </thead>
          <tbody>
            {loading && nodes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-3">
                  <Skeleton lines={3} />
                </td>
              </tr>
            ) : error && nodes.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <ErrorState message="Unable to load nodes" onRetry={reload} />
                </td>
              </tr>
            ) : nodes.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState message="No data available" />
                </td>
              </tr>
            ) : (
              nodes.map((node) => {
                const d = node.reading?.data;
                return (
                  <tr
                    key={node.node_id}
                    className="group border-b border-line/60 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/nodes/${node.node_id}`}
                        className="flex items-center gap-2 text-[12px] font-medium text-ink transition-colors hover:text-info"
                      >
                        <span className="font-mono">{node.node_id}</span>
                        <IconChevronRight size={12} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <span className="text-[10px] text-muted">{node.location}</span>
                    </td>
                    <td className="px-2 py-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: node.statusColor }}>
                        <StatusDot color={node.statusColor} pulse={node.live} size={6} />
                        {node.statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right text-tabular text-[12px] font-medium text-ink">
                      {typeof d?.aqi === "number" ? d.aqi.toFixed(1) : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-tabular text-[12px] text-ink">
                      {typeof d?.temperature === "number" ? `${d.temperature.toFixed(1)}°` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-tabular text-[12px] text-ink">
                      {typeof d?.humidity === "number" ? `${d.humidity.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-tabular text-[12px] text-ink">
                      {typeof d?.sound === "number" ? `${d.sound.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-2 py-2.5 text-right text-tabular text-[12px] text-ink">
                      {typeof d?.uv === "number" ? `${d.uv.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right text-[11px] text-muted">
                      {node.reading?.timestamp ? timeAgo(node.reading.timestamp, now) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}