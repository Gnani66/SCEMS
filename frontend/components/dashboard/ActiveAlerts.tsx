"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlertDetailModal from "@/components/dashboard/AlertDetailModal";
import { IconChevronRight } from "@/components/icons";
import { Card, EmptyState, ErrorState, SeverityBadge, Skeleton, StatusDot } from "@/components/ui";
import { getAlerts } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useApi } from "@/hooks/useApi";
import { useNow } from "@/hooks/useNow";
import { useRealtime } from "@/providers/realtime";
import type { Alert } from "@/types/scems";

function AlertRow({ alert, onClick }: { alert: Alert; onClick: () => void }) {
  const now = useNow(1000);
  const isCrit = alert.severity === "critical";
  const isWarn = alert.severity === "warning";

  return (
    <button
      onClick={onClick}
      className="alert-in group flex w-full flex-col gap-2 border-b border-[#f1f5f9] px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-[#f8fafc]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-bold tracking-wide text-[#0f172a]">
          <StatusDot color={isCrit ? "#dc2626" : isWarn ? "#d97706" : "#059669"} size={7} />
          {alert.node_id}
        </span>
        <span className="shrink-0 rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#2563eb] ring-1 ring-[#dbeafe]">
          {alert.alert_type.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm">
          <span className="font-semibold capitalize text-[#0f172a]">{alert.sensor}</span>
          <span className="font-medium text-[#64748b]"> · {alert.message}</span>
        </span>
        <span className="shrink-0 rounded-lg bg-[#f1f5f9] px-2 py-1 text-tabular text-xs font-bold text-[#0f172a]">
          {formatValue(alert.sensor, alert.actual_value)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs font-medium text-[#94a3b8]">
          {alert.created_at ? timeAgo(alert.created_at, now) : "now"}
        </span>
      </div>
    </button>
  );
}

function formatValue(sensor: string, value: number | string): string {
  const unit =
    sensor === "temperature" ? "°C"
    : sensor === "humidity" ? "%"
    : sensor === "sound" ? " dB"
    : sensor === "tvoc" ? " ppb"
    : sensor === "eco2" ? " ppm"
    : "";
  return `${value}${unit}`;
}

export default function ActiveAlerts({
  limit,
  showViewAll = true,
}: {
  limit?: number;
  showViewAll?: boolean;
}) {
  const { data, loading, error, reload } = useApi(
    () => getAlerts({ status: "active", limit: 50 }),
    [],
  );
  const { alerts: liveAlerts, upsertActiveAlerts } = useRealtime();
  const [selected, setSelected] = useState<Alert | null>(null);

  // Poll active alerts every 15s as fallback when WS stalls
  useEffect(() => {
    const id = setInterval(() => reload(), 15000);
    return () => clearInterval(id);
  }, [reload]);

  const active = useMemo(() => {
    const apiAlerts = (data?.alerts ?? []).filter(
      (a: Alert) => a.status === "active",
    );
    // Deduplicate: only keep real backend alerts with id
    const byId = new Map<number | string, Alert>();
    for (const a of apiAlerts) {
      if (a.id != null) byId.set(a.id, a);
    }
    for (const a of liveAlerts) {
      if (a.status === "acknowledged") continue;
      if (a.status !== "active" && a.status !== "critical" && a.status !== "warning") continue;
      const key = a.id != null ? a.id : `${a.node_id}-${a.sensor}-${a.created_at}`;
      if (a.id == null && !a.created_at) continue;
      if (!byId.has(key)) byId.set(key, a);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, liveAlerts]);

  useEffect(() => {
    if (!loading && !error) upsertActiveAlerts(apiActiveOnly(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const shown = limit ? active.slice(0, limit) : active;

  return (
    <Card
      className="h-full"
      kicker="Event stream"
      title="Active Alerts"
      right={
        <span className="flex items-center gap-1.5 rounded-full bg-[#fef2f2] px-2.5 py-1 text-xs font-bold text-[#dc2626] ring-1 ring-[#fecaca]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" />
          {active.length} active
        </span>
      }
    >
      <div className="flex flex-col">
        {error ? (
          <ErrorState message="Unable to load alerts" onRetry={reload} />
        ) : loading && shown.length === 0 ? (
          <div className="p-4">
            <Skeleton lines={4} />
          </div>
        ) : shown.length === 0 ? (
          <EmptyState message="No active alerts" sub="All thresholds within limits" />
        ) : (
          <div>
            {shown.map((alert, i) => (
              <AlertRow key={alert.id ?? `${alert.node_id}-${alert.sensor}-${i}`} alert={alert} onClick={() => setSelected(alert)} />
            ))}
          </div>
        )}

        {showViewAll && (
          <Link
            href="/alerts"
            className="flex items-center justify-center gap-1.5 border-t border-[#f1f5f9] bg-[#f8fafc] py-3 text-sm font-semibold text-[#2563eb] transition-colors hover:bg-[#f1f5f9] hover:text-[#1d4ed8]"
          >
            View all alerts <IconChevronRight size={14} />
          </Link>
        )}
      </div>

      {selected && (
        <AlertDetailModal
          alert={selected}
          onClose={() => setSelected(null)}
          onAcknowledged={(updated) => {
            setSelected(null);
            upsertActiveAlerts(active.filter((a) => a.id !== updated.id));
          }}
        />
      )}
    </Card>
  );
}

function apiActiveOnly(
  data: { alerts: Alert[] } | null,
): Alert[] {
  return (data?.alerts ?? []).filter((a) => a.status === "active");
}
