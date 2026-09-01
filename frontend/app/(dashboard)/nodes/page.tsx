"use client";

import Link from "next/link";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useNow } from "@/hooks/useNow";
import { Card, ErrorState, Skeleton, StatusDot } from "@/components/ui";
import { IconChevronRight } from "@/components/icons";
import { aqiCategory } from "@/lib/metrics";
import { timeAgo } from "@/lib/format";

export default function NodesPage() {
  const { nodes, loading, error, reload } = useLiveNodes();
  const now = useNow(1000);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#0f172a]">Sensor Nodes</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Distributed environmental monitoring nodes across the campus
          </p>
        </div>
        <div className="text-[11px] text-[#64748b]">
          {nodes.filter((n) => n.live).length}/{nodes.length} online
        </div>
      </div>

      {loading && nodes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <div className="p-4"><Skeleton lines={6} /></div>
            </Card>
          ))}
        </div>
      ) : error && nodes.length === 0 ? (
        <ErrorState message="Unable to load sensor nodes" onRetry={reload} />
      ) : nodes.length === 0 ? (
        <ErrorState message="No data available" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => {
            const d = node.reading?.data;
            const aqi = typeof d?.aqi === "number" ? d.aqi : null;
            const cat = aqi != null ? aqiCategory(aqi) : null;

            return (
              <Link key={node.node_id} href={`/nodes/${node.node_id}`} className="group">
                <Card hover className="h-full">
                  <div className="flex items-start justify-between border-b border-[#e2e8f0] px-4 py-3">
                    <div>
                      <p className="font-mono text-[13px] font-semibold text-[#0f172a] group-hover:text-[#2563eb]">{node.node_id}</p>
                      <p className="mt-0.5 text-[11px] text-[#64748b]">{node.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: node.statusColor }}>
                        <StatusDot color={node.statusColor} pulse={node.live} size={6} />
                        {node.statusLabel}
                      </span>
                      <IconChevronRight size={14} className="text-[#64748b] opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-px bg-[#f1f5f9]">
                    {[
                      ["Temperature", typeof d?.temperature === "number" ? `${d.temperature.toFixed(1)}°C` : "—"],
                      ["Humidity", typeof d?.humidity === "number" ? `${d.humidity.toFixed(1)}%` : "—"],
                      ["Pressure", typeof d?.pressure === "number" ? `${d.pressure.toFixed(0)} hPa` : "—"],
                      ["AQI", aqi != null ? aqi.toFixed(1) : "—"],
                      ["TVOC", typeof d?.tvoc === "number" ? `${d.tvoc.toFixed(0)}` : "—"],
                      ["eCO₂", typeof d?.eco2 === "number" ? `${d.eco2.toFixed(0)}` : "—"],
                      ["Sound", typeof d?.sound === "number" ? `${d.sound.toFixed(1)} dB` : "—"],
                      ["UV", typeof d?.uv === "number" ? d.uv.toFixed(2) : "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col gap-0.5 bg-white px-3 py-2.5">
                        <span className="text-[9px] uppercase tracking-wider text-[#64748b]">{label}</span>
                        <span className="text-tabular text-[13px] font-medium text-[#0f172a]">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-[#e2e8f0] px-4 py-2.5 text-[11px] text-[#64748b]">
                    <span className="flex items-center gap-2" style={{ color: cat?.color }}>
                      <StatusDot color={cat?.color ?? "#64748b"} size={6} />
                      {cat ? `${cat.label} air` : "No AQI"}
                    </span>
                    <span>{node.reading?.timestamp ? `Updated ${timeAgo(node.reading.timestamp, now)}` : "No readings"}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}