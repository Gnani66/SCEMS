"use client";

import { useEffect } from "react";
import NodeHealthPanel from "@/components/dashboard/NodeHealthPanel";
import { Card, Skeleton, StatusDot } from "@/components/ui";
import {
  IconChip,
  IconDatabase,
  IconHealth,
  IconSignal,
  IconSystem,
  IconWifi,
} from "@/components/icons";
import { getHealth } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useRealtime } from "@/providers/realtime";

interface ServiceTileProps {
  label: string;
  detail: string;
  color: string;
  pulse?: boolean;
  icon: React.ReactNode;
}

function ServiceTile({ label, detail, color, pulse, icon }: ServiceTileProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white p-3.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ color, backgroundColor: `${color}14`, border: `1px solid ${color}33` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[#0f172a]">{label}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px]" style={{ color }}>
          <StatusDot color={color} pulse={pulse} size={6} />
          {detail}
        </p>
      </div>
    </div>
  );
}

const FLOW = [
  { label: "Sensors", sub: "ESP32 + virtual nodes", color: "#059669" },
  { label: "MQTT", sub: "Mosquitto broker", color: "#2563eb" },
  { label: "Backend", sub: "FastAPI pipeline", color: "#7c3aed" },
  { label: "Database", sub: "Supabase PostgreSQL", color: "#d97706" },
  { label: "Realtime", sub: "WebSocket stream", color: "#059669" },
  { label: "Dashboard", sub: "Next.js UI", color: "#dc2626" },
];

const NODE_STATUS: Record<string, { label: string; color: string }> = {
  healthy: { label: "Healthy", color: "#059669" },
  running: { label: "Connected", color: "#059669" },
  connected: { label: "Connected", color: "#059669" },
  online: { label: "Connected", color: "#059669" },
  active: { label: "Connected", color: "#059669" },
  disconnected: { label: "Disconnected", color: "#EF4444" },
  unavailable: { label: "Temporarily unavailable", color: "#d97706" },
  unknown: { label: "Unknown", color: "#64748b" },
  unhealthy: { label: "Unhealthy", color: "#EF4444" },
};

export default function SystemPage() {
  const { data, loading, error, reload } = useApi(() => getHealth(), []);
  const { nodes } = useLiveNodes();
  const { connection, readings } = useRealtime();

  useEffect(() => {
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, [reload]);

  const liveCount = nodes.filter((n) => n.live).length;
  const apiState = NODE_STATUS[data?.status ?? "unknown"] ?? NODE_STATUS.unknown;
  const dbState = NODE_STATUS[data?.database ?? "unknown"] ?? NODE_STATUS.unknown;
  const mqttState = NODE_STATUS[data?.mqtt ?? "unknown"] ?? NODE_STATUS.unknown;
  const wsState =
    connection === "connected"
      ? { label: "Connected", color: "#059669" }
      : connection === "reconnecting"
        ? { label: "Reconnecting", color: "#d97706" }
        : { label: "Disconnected", color: "#EF4444" };
  const nodeState = liveCount === nodes.length && nodes.length > 0
    ? { label: `${liveCount} / ${nodes.length} Online`, color: "#059669" }
    : nodes.length > 0
      ? { label: `${liveCount} / ${nodes.length} Online`, color: "#d97706" }
      : { label: "Awaiting nodes", color: "#64748b" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#0f172a]">System Health</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            End-to-end status of the SCEMS platform
          </p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/health`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-[#2563eb] hover:underline"
        >
          Raw endpoint →
        </a>
      </div>

      {/* Diff-level tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {loading && !data ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#e2e8f0] bg-white p-3.5"><Skeleton lines={2} /></div>
          ))
        ) : (
          <>
            <ServiceTile icon={<IconSystem size={17} />} label="FastAPI Backend" detail={apiState.label} color={apiState.color} pulse={apiState.color === "#059669"} />
            <ServiceTile icon={<IconDatabase size={17} />} label="Supabase Database" detail={dbState.label} color={dbState.color} pulse={dbState.color === "#059669"} />
            <ServiceTile icon={<IconSignal size={17} />} label="MQTT Broker" detail={mqttState.label} color={mqttState.color} pulse={mqttState.color === "#059669"} />
            <ServiceTile icon={<IconWifi size={17} />} label="WebSocket Realtime" detail={wsState.label} color={wsState.color} pulse={wsState.color === "#059669"} />
            <ServiceTile icon={<IconChip size={17} />} label="Sensor Nodes" detail={nodeState.label} color={nodeState.color} pulse={nodeState.color === "#059669"} />
          </>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-[#dc2626]">
          Backend unreachable at {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}. Showing connectivity from observation: {Object.keys(readings).length} node(s) reporting.
        </p>
      )}

      {/* Pipeline */}
      <Card kicker="Data pipeline" title="Architecture" dense
        right={<span className="text-[11px] text-[#64748b]">virtual sensors → real dashboard</span>}
      >
        <div className="flex flex-col items-stretch gap-2 p-3 lg:flex-row lg:items-center">
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-2">
              <div className="flex flex-1 flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 lg:items-center">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0f172a]">
                  <StatusDot color={step.color} size={6} />
                  {step.label}
                </span>
                <span className="text-[10px] text-[#64748b]">{step.sub}</span>
              </div>
              {i < FLOW.length - 1 && (
                <span className="hidden text-[#64748b] lg:block">→</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-12">
        <section className="xl:col-span-7">
          <NodeHealthPanel />
        </section>

        <section className="xl:col-span-5">
          <Card kicker="Platform" title="SCEMS Platform" dense>
            <div className="flex flex-col divide-y divide-[#e2e8f0]/60">
              {[
                ["MQTT Broker", "Mosquitto"],
                ["Backend", "FastAPI"],
                ["Database", "Supabase PostgreSQL"],
                ["Realtime", "WebSocket"],
                ["Frontend", "Next.js"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-3 py-2.5 text-[12px]">
                  <span className="text-[#64748b]">{label}</span>
                  <span className="font-medium text-[#0f172a]">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                <IconHealth size={13} />
                API version
              </span>
              <span className="text-tabular font-mono text-[12px] text-[#2563eb]">
                0.2.0
              </span>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}