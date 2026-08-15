"use client";

import { useState } from "react";
import { IconClose } from "@/components/icons";
import { SeverityBadge, StatusDot } from "@/components/ui";
import { acknowledgeAlert } from "@/lib/api";
import { cn, dateTimeLabel } from "@/lib/format";
import { severityColor } from "@/lib/metrics";
import type { Alert } from "@/types/scems";

export default function AlertDetailModal({
  alert,
  onClose,
  onAcknowledged,
}: {
  alert: Alert;
  onClose: () => void;
  onAcknowledged: (alert: Alert) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(alert.status === "acknowledged");

  const color = severityColor(alert.severity);

  async function handleAcknowledge() {
    if (alert.id == null) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await acknowledgeAlert(alert.id);
      setDone(true);
      onAcknowledged(updated);
    } catch {
      setError("Unable to acknowledge alert. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
      <div className="alert-in relative w-full max-w-sm rounded-xl border border-line2 bg-elev p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="section-kicker mb-1">Alert Details</p>
            <h3 className="text-[15px] font-semibold text-ink">{alert.sensor}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/5 hover:text-ink"
          >
            <IconClose size={15} />
          </button>
        </div>

        <dl className="mb-4 space-y-2.5 text-[12px]">
          <Row label="Node" value={alert.node_id} />
          <Row label="Parameter" value={alert.sensor} />
          <Row label="Value" value={`${alert.actual_value}`} highlight />
          <Row label="Threshold" value={`${alert.threshold}`} />
          <Row label="Severity" value={<SeverityBadge severity={alert.severity} />} />
          <Row
            label="Created"
            value={alert.created_at ? dateTimeLabel(alert.created_at) : "—"}
          />
        </dl>

        <div className="mb-4 rounded-lg border border-line bg-app2 px-3 py-2.5">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color }}>
            <StatusDot color={color} size={6} />
            {alert.severity.toUpperCase()}
          </p>
          <p className="text-[12px] leading-snug text-secondary">
            {alert.message || `${alert.sensor} threshold breached on ${alert.node_id}`}
          </p>
        </div>

        {error && <p className="mb-3 text-[11px] text-crit">{error}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={handleAcknowledge}
            disabled={done || busy || alert.id == null}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors",
              done
                ? "border-line bg-app2 text-muted"
                : "border-line2 bg-card2 text-ink hover:bg-elev disabled:opacity-50",
            )}
          >
            {done
              ? "Acknowledged"
              : busy
                ? "Acknowledging…"
                : alert.id == null
                  ? "Awaiting sync"
                  : "Acknowledge Alert"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-2 text-[12px] text-secondary transition-colors hover:text-ink"
          >
            Close
          </button>
        </div>

        {done && (
          <p className="mt-2 text-[11px] text-ok">
            Alert acknowledged · synced to server
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-tabular font-medium text-ink", highlight && "text-base")}>{value}</dd>
    </div>
  );
}