"use client";

import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useNow } from "@/hooks/useNow";
import { Card, Skeleton, StatusDot } from "@/components/ui";
import { formatUptime, formatBytes, timeAgo } from "@/lib/format";

export default function NodeHealthPanel() {
  const { nodes, loading, error, reload } = useLiveNodes();
  const now = useNow(1000);

  return (
    <Card
      className="h-full"
      kicker="Connectivity"
      title="Node Health"
      right={
        error && nodes.length > 0 ? (
          <button onClick={reload} className="text-[11px] text-info hover:underline">Retry</button>
        ) : (
          <span className="text-[11px] text-muted">
            {nodes.filter((n) => n.live).length}/{nodes.length} online
          </span>
        )
      }
    >
      <div className="flex flex-col">
        {loading && nodes.length === 0 ? (
          <div className="p-3"><Skeleton lines={3} /></div>
        ) : nodes.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center">
            <p className="text-xs text-muted">
              {error ? "Unable to load node health" : "No data available"}
            </p>
          </div>
        ) : (
          nodes.map((node) => {
            const h = node.health;
            return (
              <div key={node.node_id} className="flex flex-col gap-2.5 border-b border-line/60 px-3 py-3 last:border-b-0">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[12px] font-medium text-ink">
                    <StatusDot color={node.statusColor} pulse={node.live} size={6} />
                    {node.node_id}
                  </span>
                  <span
                    className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
                    style={{ color: node.statusColor, backgroundColor: `${node.statusColor}14` }}
                  >
                    {node.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  <HealthCell label="Wi-Fi" value={h ? `${h.wifi_rssi} dBm` : "—"} />
                  <HealthCell label="Uptime" value={h ? formatUptime(h.uptime) : "—"} />
                  <HealthCell label="Memory" value={h ? formatBytes(h.free_heap) : "—"} />
                  <HealthCell label="Last reading" value={node.reading?.timestamp ? timeAgo(node.reading.timestamp, now) : "—"} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function HealthCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-wider text-muted">{label}</span>
      <span className="truncate text-tabular font-medium text-secondary">{value}</span>
    </div>
  );
}