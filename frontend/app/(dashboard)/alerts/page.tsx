"use client";

import { useEffect, useMemo, useState } from "react";
import AlertDetailModal from "@/components/dashboard/AlertDetailModal";
import { Card, EmptyState, ErrorState, SeverityBadge, Skeleton, StatusDot } from "@/components/ui";
import { getAlerts } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useNow } from "@/hooks/useNow";
import { useRealtime } from "@/providers/realtime";
import { cn, dateTimeLabel, timeAgo } from "@/lib/format";
import { severityColor } from "@/lib/metrics";
import type { Alert } from "@/types/scems";

type Filter = "all" | "active" | "warning" | "critical" | "acknowledged";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "warning", label: "Warning" },
  { key: "critical", label: "Critical" },
  { key: "acknowledged", label: "Acknowledged" },
];

export default function AlertsPage() {
  const { data, loading, error, reload } = useApi(
    () => getAlerts({ limit: 200 }),
    [],
  );
  const { alerts: liveAlerts, upsertActiveAlerts } = useRealtime();
  const now = useNow(1000);
  const [filter, setFilter] = useState<Filter>("active");
  const [selected, setSelected] = useState<Alert | null>(null);

  // Poll alerts every 15s so list stays fresh even if WS drops
  useEffect(() => {
    const id = setInterval(() => reload(), 15000);
    return () => clearInterval(id);
  }, [reload]);

  const all = useMemo(() => {
    const byId = new Map<number | string, Alert>();
    for (const a of data?.alerts ?? []) {
      if (a.id != null) byId.set(a.id, a);
      else if (a.created_at) byId.set(`${a.node_id}-${a.sensor}-${a.created_at}`, a);
    }
    for (const a of liveAlerts) {
      if (a.status === "acknowledged") continue;
      const key = a.id != null ? a.id : `${a.node_id}-${a.sensor}-${a.created_at}`;
      if (a.id == null && !a.created_at) continue;
      if (!byId.has(key)) byId.set(key, a);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [data, liveAlerts]);

  const filtered = useMemo(() => {
    switch (filter) {
      case "active":
        return all.filter((a) => a.status === "active" || !a.status);
      case "warning":
        return all.filter((a) => a.severity === "warning" && (a.status !== "acknowledged"));
      case "critical":
        return all.filter((a) => a.severity === "critical" && (a.status !== "acknowledged"));
      case "acknowledged":
        return all.filter((a) => a.status === "acknowledged");
      default:
        return all;
    }
  }, [all, filter]);

  const counts = useMemo(() => ({
    all: all.length,
    active: all.filter((a) => a.status === "active" || !a.status).length,
    warning: all.filter((a) => a.severity === "warning" && a.status !== "acknowledged").length,
    critical: all.filter((a) => a.severity === "critical" && a.status !== "acknowledged").length,
    acknowledged: all.filter((a) => a.status === "acknowledged").length,
  }), [all]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-[#0f172a]">Alerts</h1>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Threshold breaches evaluated by the SCEMS alert engine
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[#e2e8f0] bg-white p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === f.key ? "bg-[#2563eb] text-white shadow-sm text-[#0f172a]" : "text-[#64748b] hover:text-[#334155]",
              )}
            >
              {f.label}
              <span className={cn(
                "rounded-full px-1.5 text-[9px] font-bold",
                filter === f.key ? "bg-white/10" : "bg-white/5",
              )}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message="Unable to load alerts" onRetry={reload} />
      ) : (
        <Card dense>
          {loading && filtered.length === 0 ? (
            <div className="p-3"><Skeleton lines={6} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState message="No alerts in this view" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-[#e2e8f0] text-[10px] uppercase tracking-wider text-[#64748b]">
                    <th className="px-3 py-2.5 font-medium">Severity</th>
                    <th className="px-2 py-2.5 font-medium">Node</th>
                    <th className="px-2 py-2.5 font-medium">Parameter</th>
                    <th className="px-2 py-2.5 text-right font-medium">Value</th>
                    <th className="px-2 py-2.5 text-right font-medium">Threshold</th>
                    <th className="px-2 py-2.5 font-medium">Message</th>
                    <th className="px-2 py-2.5 font-medium">Created</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-3 py-2.5 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alert, i) => {
                    const color = severityColor(alert.severity);
                    const acknowledged = alert.status === "acknowledged";
                    const actionable = alert.id != null && !acknowledged;
                    return (
                      <tr
                        key={alert.id ?? `${alert.node_id}-${alert.sensor}-${i}`}
                        className="alert-in border-b border-[#f1f5f9] text-[12px] transition-colors last:border-b-0 hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <StatusDot color={color} size={6} />
                            <SeverityBadge severity={alert.severity} />
                          </span>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[#0f172a]">{alert.node_id}</td>
                        <td className="px-2 py-2.5 capitalize text-[#334155]">{alert.sensor}</td>
                        <td className="px-2 py-2.5 text-right text-tabular font-semibold text-[#0f172a]">{fmtValue(alert.sensor, alert.actual_value)}</td>
                        <td className="px-2 py-2.5 text-right text-tabular text-[#64748b]">{fmtValue(alert.sensor, alert.threshold)}</td>
                        <td className="max-w-[260px] truncate px-2 py-2.5 text-[#334155]">{alert.message}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-[#64748b]" title={alert.created_at}>
                          {alert.created_at ? `${timeAgo(alert.created_at, now)} · ${dateTimeLabel(alert.created_at)}` : "now"}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", acknowledged ? "bg-muted/15 text-[#64748b]" : "bg-ok/15 text-[#059669]")}>
                            {acknowledged ? "ACK" : "ACTIVE"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => actionable ? setSelected(alert) : undefined}
                            disabled={!actionable}
                            className={cn(
                              "rounded-md border px-2 py-1 text-[10px] font-semibold transition-colors",
                              actionable
                                ? "border-[#cbd5e1] bg-[#f8fafc] text-[#0f172a] hover:bg-white"
                                : "border-[#e2e8f0] text-[#64748b] opacity-40",
                            )}
                          >
                            {acknowledged ? "Done" : "Acknowledge"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selected && (
        <AlertDetailModal
          alert={selected}
          onClose={() => setSelected(null)}
          onAcknowledged={(updated) => {
            setSelected(null);
            upsertActiveAlerts(all.filter((a) => a.id !== updated.id));
          }}
        />
      )}
    </div>
  );
}

function fmtValue(sensor: string, value: number): string {
  const unit =
    sensor === "temperature" ? "°C"
    : sensor === "humidity" ? "%"
    : sensor === "sound" ? " dB"
    : sensor === "tvoc" ? " ppb"
    : sensor === "eco2" ? " ppm"
    : "";
  return typeof value === "number" ? `${value}${unit}` : "—";
}