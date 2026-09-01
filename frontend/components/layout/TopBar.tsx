"use client";

import Link from "next/link";
import { useEffect } from "react";
import { IconBell, IconBellDot, IconLogo } from "@/components/icons";
import { StatusDot } from "@/components/ui";
import { getHealth } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useRealtime } from "@/providers/realtime";
import { useNow } from "@/hooks/useNow";

const WS_LABEL: Record<string, { label: string; color: string; bg: string; border: string; pulse: boolean }> = {
  connected: { label: "LIVE", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0", pulse: true },
  connecting: { label: "CONNECTING", color: "#d97706", bg: "#fffbeb", border: "#fde68a", pulse: false },
  reconnecting: { label: "RECONNECTING", color: "#d97706", bg: "#fffbeb", border: "#fde68a", pulse: false },
  disconnected: { label: "CONNECTION LOST", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", pulse: false },
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
  const color = apiOk && databaseOk && mqttOk ? "#059669" : apiOk ? "#d97706" : "#dc2626";
  const bg = apiOk && databaseOk && mqttOk ? "#ecfdf5" : apiOk ? "#fffbeb" : "#fef2f2";
  const border = apiOk && databaseOk && mqttOk ? "#a7f3d0" : apiOk ? "#fde68a" : "#fecaca";

  return (
    <button
      onClick={reload}
      title={`API ${data?.status ?? "unknown"} · Database ${data?.database ?? "unknown"} · MQTT ${data?.mqtt ?? "unknown"}`}
      className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide transition-colors hover:brightness-[0.98] sm:flex"
      style={{ color, borderColor: border, backgroundColor: bg }}
    >
      <StatusDot color={color} pulse={apiOk} size={7} />
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
    <header className="flex h-[64px] shrink-0 items-center justify-between gap-4 border-b border-[#e2e8f0] bg-white px-4 sm:px-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      {/* Left — Brand + title */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 md:hidden">
          <IconLogo size={20} />
        </div>
        <div className="min-w-0 leading-none">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-bold tracking-tight text-[#0f172a]">SCEMS</h1>
            <span className="hidden rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb] ring-1 ring-[#dbeafe] sm:inline-flex">
              CAMPUS IOT
            </span>
          </div>
          <p className="mt-1 hidden text-xs font-medium text-[#64748b] sm:block">
            Smart Campus Environmental Monitoring System
          </p>
          <p className="mt-1 text-xs font-medium text-[#64748b] sm:hidden">Environmental Monitoring</p>
        </div>
      </div>

      {/* Right — Status + actions */}
      <div className="flex items-center gap-2.5">
        {/* LIVE pill — Zoho style */}
        <div
          className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wide sm:flex"
          style={{ color: ws.color, borderColor: ws.border, backgroundColor: ws.bg }}
          title={`Realtime WebSocket: ${connection}`}
        >
          <StatusDot color={ws.color} pulse={ws.pulse} size={7} />
          {ws.label}
          {connection === "reconnecting" && <span className="hidden xl:inline font-medium">· Reconnecting…</span>}
        </div>

        {updatedAt && (
          <span className="hidden text-xs font-medium text-[#94a3b8] lg:block">
            Updated {Math.max(1, Math.round((now - updatedAt) / 1000))}s ago
          </span>
        )}

        <div className="h-6 w-px bg-[#e2e8f0] hidden sm:block" />

        <Link
          href="/alerts"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-all hover:border-[#cbd5e1] hover:text-[#0f172a] hover:shadow-md"
          title="Alerts"
        >
          {unread > 0 ? <IconBellDot size={18} /> : <IconBell size={18} />}
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#dc2626] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <HealthPill />
      </div>
    </header>
  );
}
