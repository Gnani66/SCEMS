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
  const statusOk = alert.severity === "normal";

  return (
    <button
      onClick={onClick}
      className="alert-in group flex w-full flex-col gap-2 border-b border-line px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-white/[0.03]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold tracking-wide text-secondary">
          <StatusDot color={statusOk ? "#4ADE80" : alert.severity === "critical" ? "#EF4444" : "#F5B942"} size={6} />
          {alert.node_id}
        </span>
        <span className="shrink-0 rounded-md bg-app2 px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-info">
          {alert.alert_type.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[12px] text-secondary">
          <span className="font-medium capitalize text-ink">{alert.sensor}</span>
          <span className="text-muted"> · {alert.message}</span>
        </span>
        <span className="text-tabular text-[12px] font-semibold text-ink">
          {formatValue(alert.sensor, alert.actual_value)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <SeverityBadge severity={alert.severity} />
        <span className="text-[10px] text-muted">
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

  // Roll live WS alerts into the list (they are not yet in the DB poll).
  const active = useMemo(() => {
    const apiAlerts = (data?.alerts ?? []).filter(
      (a: Alert) => a.status === "active" || !a.status,
    );
    const seen = new Set(apiAlerts.map((a) => a.id));
    const live = liveAlerts.filter((a) => (a.id == null || !seen.has(a.id)));
    return [...live, ...apiAlerts];
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
        <span className="rounded-full bg-crit/15 px-2 py-0.5 text-[10px] font-semibold text-crit">
          {active.length}
        </span>
      }
    >
      <div className="flex flex-col">
        {error ? (
          <ErrorState message="Unable to load alerts" onRetry={reload} />
        ) : loading && shown.length === 0 ? (
          <div className="p-3">
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
            className="flex items-center justify-center gap-1 border-t border-line py-2.5 text-[12px] text-secondary transition-colors hover:text-ink"
          >
            View all alerts <IconChevronRight size={13} />
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
  return (data?.alerts ?? []).filter(
    (a) => a.status === "active" || !a.status,
  );
}