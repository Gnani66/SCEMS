"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IconBell, IconBellDot, IconLogo } from "@/components/icons";
import { StatusDot } from "@/components/ui";
import { getHealth } from "@/lib/api";
import { cn } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { useRealtime } from "@/providers/realtime";
import { useNow } from "@/hooks/useNow";

const WS_LABEL: Record<string, { label: string; color: string; pulse: boolean }> = {
  connected: { label: "LIVE", color: "#4ADE80", pulse: true },
  connecting: { label: "CONNECTING", color: "#F5B942", pulse: false },
  reconnecting: { label: "RECONNECTING", color: "#F5B942", pulse: false },
  disconnected: { label: "CONNECTION LOST", color: "#EF4444", pulse: false },
};

function HealthPill() {
  const { data, reload } = useApi(() => getHealth(), []);

  useEffect(() => {
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, [reload]);

  const databaseOk = data?.database === "healthy";
  const mqttOk = data?.mqtt === "running" || data?.mqtt === "connected";
  const apiOk = data?.status === "healthy" && data != null;

  const overall = apiOk ? (databaseOk && mqttOk ? "SYSTEM ONLINE" : "DEGRADED") : "OFFLINE";
  const color = apiOk && databaseOk && mqttOk ? "#4ADE80" : apiOk ? "#F5B942" : "#EF4444";

  return (
    <button
      onClick={reload}
      title={`API ${data?.status ?? "unknown"} · Database ${data?.database ?? "unknown"} · MQTT ${data?.mqtt ?? "unknown"}`}
      className={cn(
        "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-colors",
      )}
      style={{ color, borderColor: `${color}3d`, backgroundColor: `${color}14` }}
    >
      <StatusDot color={color} pulse={apiOk} />
      {overall}
    </button>
  );
}

export default function TopBar() {
  const { connection, alerts, updatedAt } = useRealtime();
  const now = useNow();
  const ws = WS_LABEL[connection] ?? WS_LABEL.reconnecting;
  const unread = alerts.filter((a) => a.status === "active" || a.id == null).length;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-app2/80 px-4 backdrop-blur-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line2 bg-card2 text-ok">
          <IconLogo size={20} />
        </div>
        <div className="min-w-0 leading-none">
          <h1 className="text-sm font-semibold tracking-tight text-ink">SCEMS</h1>
          <p className="mt-1 truncate text-[11px] text-muted">
            Smart Campus Environmental Monitoring System
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div
          className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide sm:flex"
          style={{ color: ws.color, borderColor: `${ws.color}3d`, backgroundColor: `${ws.color}12` }}
          title={`Realtime WebSocket: ${connection}`}
        >
          <StatusDot color={ws.color} pulse={ws.pulse} />
          {ws.label}
          {connection === "reconnecting" && <span className="hidden xl:inline">· Reconnecting…</span>}
        </div>

        {updatedAt && (
          <span className="hidden text-[11px] text-muted lg:block">
            Updated {Math.max(1, Math.round((now - updatedAt) / 1000))}s ago
          </span>
        )}

        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-secondary transition-colors hover:text-ink"
          title="Alerts"
        >
          {unread > 0 ? <IconBellDot size={17} /> : <IconBell size={17} />}
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crit px-1 text-[9px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <HealthPill />
      </div>
    </header>
  );
}