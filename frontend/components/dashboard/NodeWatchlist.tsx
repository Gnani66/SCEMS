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
        <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-medium text-[#64748b] ring-1 ring-[#e2e8f0]">
          {nodes.length} node{nodes.length === 1 ? "" : "s"}
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[10px] font-bold uppercase tracking-widest text-[#64748b]">
              <th className="px-4 py-3">Node</th>
              <th className="px-2 py-3">Status</th>
              <th className="px-2 py-3 text-right">AQI</th>
              <th className="px-2 py-3 text-right">Temp</th>
              <th className="px-2 py-3 text-right">Humidity</th>
              <th className="px-2 py-3 text-right">Sound</th>
              <th className="px-2 py-3 text-right">UV</th>
              <th className="px-4 py-3 text-right">Last update</th>
            </tr>
          </thead>
          <tbody>
            {loading && nodes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4">
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
                  <EmptyState message="No nodes registered" sub="Add a sensor node to get started" />
                </td>
              </tr>
            ) : (
              nodes.map((node) => {
                const d = node.reading?.data;
                return (
                  <tr
                    key={node.node_id}
                    className="group border-b border-[#f1f5f9] transition-colors hover:bg-[#f8fafc]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/nodes/${node.node_id}`}
                        className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] transition-colors hover:text-[#2563eb]"
                      >
                        <span className="font-mono text-xs">{node.node_id}</span>
                        <IconChevronRight size={12} className="text-[#94a3b8] opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                      <span className="text-xs font-medium text-[#64748b]">{node.location}</span>
                    </td>
                    <td className="px-2 py-3">
                      <span className="flex items-center gap-1.5 rounded-full border bg-white px-2 py-1 text-[11px] font-bold" style={{ color: node.statusColor, borderColor: `${node.statusColor}30`, backgroundColor: `${node.statusColor}12` }}>
                        <StatusDot color={node.statusColor} pulse={node.live} size={6} />
                        {node.statusLabel}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right text-tabular text-sm font-semibold text-[#0f172a]">
                      {typeof d?.aqi === "number" ? d.aqi.toFixed(1) : "—"}
                    </td>
                    <td className="px-2 py-3 text-right text-tabular text-sm font-medium text-[#334155]">
                      {typeof d?.temperature === "number" ? `${d.temperature.toFixed(1)}°` : "—"}
                    </td>
                    <td className="px-2 py-3 text-right text-tabular text-sm font-medium text-[#334155]">
                      {typeof d?.humidity === "number" ? `${d.humidity.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-2 py-3 text-right text-tabular text-sm font-medium text-[#334155]">
                      {typeof d?.sound === "number" ? `${d.sound.toFixed(1)}` : "—"}
                    </td>
                    <td className="px-2 py-3 text-right text-tabular text-sm font-medium text-[#334155]">
                      {typeof d?.uv === "number" ? `${d.uv.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-medium text-[#64748b]">
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
