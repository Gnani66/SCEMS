"use client";

import Link from "next/link";
import { useMemo } from "react";
import ActiveAlerts from "@/components/dashboard/ActiveAlerts";
import LiveTrendChart from "@/components/dashboard/LiveTrendChart";
import { Card, EmptyState, Skeleton, StatusDot } from "@/components/ui";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useNow } from "@/hooks/useNow";
import { getAlerts, getReadingsHistory } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { formatBytes, formatUptime, timeAgo, timeLabel } from "@/lib/format";
import { METRICS } from "@/lib/metrics";
import { useRealtime } from "@/providers/realtime";
import type { Alert, FlatReading } from "@/types/scems";

export default function NodeDetail({ nodeId }: { nodeId: string }) {
  const { nodes, loading } = useLiveNodes();
  const now = useNow(1000);
  const { health: realtimeHealth } = useRealtime();

  const node = nodes.find((n) => n.node_id === nodeId);

  const recent = useApi(
    () => getReadingsHistory({ nodeId, hours: 24, limit: 20 }),
    [nodeId],
  );

  const alerts = useApi(
    () => getAlerts({ status: "active", limit: 30 }),
    [],
  );
  const nodeAlerts = useMemo(
    () => (alerts.data?.alerts ?? []).filter((a: Alert) => a.node_id === nodeId),
    [alerts.data, nodeId],
  );

  if (loading && !node) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!node) {
    return (
      <Card>
        <EmptyState
          message="Node not found"
          sub="The node may not have reported data yet"
        />
        <div className="pb-4 text-center">
          <Link href="/nodes" className="text-xs text-info hover:underline">
            Back to all nodes
          </Link>
        </div>
      </Card>
    );
  }

  const d = node.reading?.data;
  const health = realtimeHealth[nodeId] ?? node.health;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-mono text-[19px] font-semibold text-ink">{nodeId}</h1>
              <span
                className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold"
                style={{ color: node.statusColor, borderColor: `${node.statusColor}44`, backgroundColor: `${node.statusColor}12` }}
              >
                <StatusDot color={node.statusColor} pulse={node.live} size={6} />
                {node.statusLabel}
              </span>
            </div>
            <p className="mt-1 text-[12px] text-muted">
              {node.location} · {node.name}
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted">
          {node.reading?.timestamp ? (
            <>
              Last reading <span className="text-secondary">{timeLabel(node.reading.timestamp)}</span>
              <br />
              <span>{timeAgo(node.reading.timestamp, now)}</span>
            </>
          ) : (
            "No readings received yet"
          )}
        </div>
      </div>

      {/* Current metrics */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line/40 sm:grid-cols-5 xl:grid-cols-10">
        {METRICS.map((meta) => {
          const raw = d?.[meta.key];
          const has = raw != null;
          return (
            <div key={meta.key} className="flex flex-col gap-1.5 bg-card p-3">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted">{meta.short}</span>
              <span className="text-tabular text-[15px] font-semibold text-ink">
                {!has ? "—" : meta.key === "rain" ? (raw ? "Yes" : "No") : (raw as number).toFixed(meta.precision)}
              </span>
              {meta.key !== "rain" && (
                <span className="text-[10px]" style={{ color: meta.accent }}>{meta.label}</span>
              )}
            </div>
          );
        })}
      </section>

      {/* Telemetry */}
      <section>
        <Card kicker="Device telemetry" title="System Health" dense
          right={
            health ? (
              <span className="text-[11px] text-muted">FW {health.firmware_version}</span>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-px bg-line/40 sm:grid-cols-4">
            {[
              ["Wi-Fi Signal", health ? `${health.wifi_rssi} dBm` : "—"],
              ["Uptime", health ? formatUptime(health.uptime) : "—"],
              ["Free Memory", health ? formatBytes(health.free_heap) : "—"],
              ["Firmware", health?.firmware_version ?? "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 bg-card px-3 py-3">
                <span className="text-[9px] uppercase tracking-wider text-muted">{label}</span>
                <span className="text-tabular text-[13px] font-medium text-ink">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Live chart */}
      <section>
        <LiveTrendChart nodes={[nodeId]} height={260} />
      </section>

      {/* Recent readings + alerts */}
      <div className="grid gap-4 xl:grid-cols-12">
        <section className="xl:col-span-7">
          <Card kicker="Historical" title="Recent Readings" dense
            right={
              recent.data ? (
                <span className="text-[11px] text-muted">{recent.data.readings.length} rows</span>
              ) : undefined
            }
          >
            {recent.loading ? (
              <div className="p-3"><Skeleton lines={4} /></div>
            ) : !recent.data?.readings.length ? (
              <EmptyState message="No readings stored yet" />
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-2 py-2 text-right font-medium">Temp</th>
                      <th className="px-2 py-2 text-right font-medium">Hum</th>
                      <th className="px-2 py-2 text-right font-medium">AQI</th>
                      <th className="px-2 py-2 text-right font-medium">eCO₂</th>
                      <th className="px-2 py-2 text-right font-medium">Sound</th>
                      <th className="px-2 py-2 text-right font-medium">UV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(recent.data!.readings as FlatReading[]).map((r, i) => (
                      <tr key={i} className="border-b border-line/50 text-[12px] last:border-b-0">
                        <td className="px-3 py-2 text-tabular text-muted">{timeLabel(r.timestamp)}</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.temperature.toFixed(1)}°</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.humidity.toFixed(1)}%</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.aqi.toFixed(1)}</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.eco2.toFixed(0)}</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.sound.toFixed(1)} dB</td>
                        <td className="px-2 py-2 text-right text-tabular text-ink">{r.uv.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>

        <section className="xl:col-span-5">
          <ActiveAlerts limit={6} showViewAll={false} />
          {nodeAlerts.length > 0 && (
            <p className="mt-1.5 text-[11px] text-muted">
              {nodeAlerts.length} active alert{nodeAlerts.length > 1 ? "s" : ""} for {nodeId}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}