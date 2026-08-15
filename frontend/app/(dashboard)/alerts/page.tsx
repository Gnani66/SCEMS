"use client";

import { useMemo, useState } from "react";
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

  const all = useMemo(() => {
    const seen = new Set((data?.alerts ?? []).map((a) => a.id));
    const live = liveAlerts.filter((a) => a.id == null || !seen.has(a.id));
    return [...live, ...(data?.alerts ?? [])];
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
          <h1 className="text-[20px] font-semibold tracking-tight text-ink">Alerts</h1>
          <p className="mt-1 text-[12px] text-muted">
            Threshold breaches evaluated by the SCEMS alert engine
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-line bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                filter === f.key ? "bg-white/[0.09] text-ink" : "text-muted hover:text-secondary",
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
                  <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
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
                        className="alert-in border-b border-line/50 text-[12px] transition-colors last:border-b-0 hover:bg-white/[0.03]"
                      >
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-1.5">
                            <StatusDot color={color} size={6} />
                            <SeverityBadge severity={alert.severity} />
                          </span>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-ink">{alert.node_id}</td>
                        <td className="px-2 py-2.5 capitalize text-secondary">{alert.sensor}</td>
                        <td className="px-2 py-2.5 text-right text-tabular font-semibold text-ink">{fmtValue(alert.sensor, alert.actual_value)}</td>
                        <td className="px-2 py-2.5 text-right text-tabular text-muted">{fmtValue(alert.sensor, alert.threshold)}</td>
                        <td className="max-w-[260px] truncate px-2 py-2.5 text-secondary">{alert.message}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-muted" title={alert.created_at}>
                          {alert.created_at ? `${timeAgo(alert.created_at, now)} · ${dateTimeLabel(alert.created_at)}` : "now"}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", acknowledged ? "bg-muted/15 text-muted" : "bg-ok/15 text-ok")}>
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
                                ? "border-line2 bg-card2 text-ink hover:bg-elev"
                                : "border-line text-muted opacity-40",
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