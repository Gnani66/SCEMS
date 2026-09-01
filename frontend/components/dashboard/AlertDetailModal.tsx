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
      <button className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="alert-in relative w-full max-w-md rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="section-kicker mb-1.5">Alert Details</p>
            <h3 className="text-[16px] font-bold tracking-tight text-[#0f172a]">{alert.sensor}</h3>
            <p className="text-xs font-medium text-[#64748b]">{alert.node_id} · {alert.alert_type}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-colors hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <IconClose size={16} />
          </button>
        </div>

        <dl className="mb-4 space-y-3 rounded-xl bg-[#f8fafc] p-4 ring-1 ring-[#f1f5f9]">
          <Row label="Node" value={<span className="font-mono text-xs font-semibold">{alert.node_id}</span>} />
          <Row label="Parameter" value={<span className="font-semibold capitalize">{alert.sensor}</span>} />
          <Row label="Value" value={<span className="rounded-lg bg-white px-2 py-1 font-bold ring-1 ring-[#e2e8f0]">{`${alert.actual_value}`}</span>} />
          <Row label="Threshold" value={`${alert.threshold}`} />
          <Row label="Severity" value={<SeverityBadge severity={alert.severity} />} />
          <Row
            label="Created"
            value={alert.created_at ? dateTimeLabel(alert.created_at) : "—"}
          />
        </dl>

        <div className="mb-4 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold" style={{ color }}>
            <StatusDot color={color} size={6} />
            {alert.severity.toUpperCase()}
          </p>
          <p className="text-sm leading-snug text-[#334155]">
            {alert.message || `${alert.sensor} threshold breached on ${alert.node_id}`}
          </p>
        </div>

        {error && <p className="mb-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#dc2626] ring-1 ring-[#fecaca]">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleAcknowledge}
            disabled={done || busy || alert.id == null}
            className={cn(
              "flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors shadow-sm",
              done
                ? "border border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]"
                : "bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed shadow-[#2563eb]/20",
            )}
          >
            {done
              ? "Acknowledged"
              : busy
                ? "Acknowledging..."
                : alert.id == null
                  ? "Awaiting sync"
                  : "Acknowledge Alert"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-semibold text-[#334155] shadow-sm transition-colors hover:bg-[#f8fafc]"
          >
            Close
          </button>
        </div>

        {done && (
          <p className="mt-3 rounded-lg bg-[#ecfdf5] px-3 py-2 text-xs font-semibold text-[#059669] ring-1 ring-[#a7f3d0]">
            Alert acknowledged — synced to server
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="font-medium text-[#64748b]">{label}</dt>
      <dd className="text-tabular font-semibold text-[#0f172a]">{value}</dd>
    </div>
  );
}
