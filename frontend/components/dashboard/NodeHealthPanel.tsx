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
          <button onClick={reload} className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb] ring-1 ring-[#dbeafe] hover:bg-[#dbeafe]">Retry</button>
        ) : (
          <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-medium text-[#64748b] ring-1 ring-[#e2e8f0]">
            {nodes.filter((n) => n.live).length}/{nodes.length} online
          </span>
        )
      }
    >
      <div className="flex flex-col">
        {loading && nodes.length === 0 ? (
          <div className="p-4"><Skeleton lines={3} /></div>
        ) : nodes.length === 0 ? (
          <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 py-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1f5f9] text-[#94a3b8]">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="18" height="18" rx={2} /><path d="M9 9h6M9 15h6" /></svg>
            </div>
            <p className="text-sm font-medium text-[#64748b]">
              {error ? "Unable to load node health" : "No nodes found"}
            </p>
          </div>
        ) : (
          nodes.map((node) => {
            const h = node.health;
            const isLive = node.live;
            return (
              <div key={node.node_id} className="flex flex-col gap-3 border-b border-[#f1f5f9] px-4 py-4 last:border-b-0 hover:bg-[#f8fafc] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-[#0f172a]">
                    <StatusDot color={node.statusColor} pulse={isLive} size={7} />
                    {node.node_id}
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide"
                    style={{
                      color: node.statusColor,
                      backgroundColor: isLive ? "#ecfdf5" : node.statusColor === "#dc2626" ? "#fef2f2" : "#fffbeb",
                      borderColor: isLive ? "#a7f3d0" : node.statusColor === "#dc2626" ? "#fecaca" : "#fde68a",
                    }}
                  >
                    {node.statusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
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
    <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-[#f8fafc] px-2.5 py-2 ring-1 ring-[#f1f5f9]">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">{label}</span>
      <span className="truncate text-xs font-semibold text-[#334155] text-tabular">{value}</span>
    </div>
  );
}
