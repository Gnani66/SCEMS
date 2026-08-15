"use client";

import LiveNodeCard from "@/components/dashboard/LiveNodeCard";
import { ErrorState, Skeleton, StatusDot } from "@/components/ui";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useRealtime } from "@/providers/realtime";

export default function LivePage() {
  const { connection, connectedAt } = useRealtime();
  const { nodes, loading, error, reload } = useLiveNodes();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">Live Monitor</h1>
          <p className="mt-1 text-[12px] text-muted">
            Real-time sensor streams from every campus node
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
          style={{
            color: connection === "connected" ? "#4ADE80" : "#F5B942",
            borderColor: connection === "connected" ? "#4ADE8044" : "#F5B94244",
            backgroundColor: connection === "connected" ? "#4ADE8012" : "#F5B94212",
          }}
        >
          <StatusDot
            color={connection === "connected" ? "#4ADE80" : "#F5B942"}
            pulse={connection === "connected"}
            size={6}
          />
          {connection === "connected" ? "REALTIME STREAM ACTIVE" : "RECONNECTING…"}
          {connectedAt && connection === "connected" ? (
            <span className="hidden font-medium text-muted sm:inline">
              {new Date(connectedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>
      </div>

      {loading && nodes.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-1 xl:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : error && nodes.length === 0 ? (
        <ErrorState message="Unable to load live data" onRetry={reload} />
      ) : nodes.length === 0 ? (
        <ErrorState message="No data available" sub="Waiting for nodes to report" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {nodes.map((node) => (
            <LiveNodeCard
              key={node.node_id}
              nodeId={node.node_id}
              name={node.name}
              location={node.location}
              reading={node.reading}
              statusColor={node.statusColor}
              statusLabel={node.statusLabel}
              live={node.live}
            />
          ))}
        </div>
      )}
    </div>
  );
}