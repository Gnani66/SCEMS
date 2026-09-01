"use client";

import ActiveAlerts from "@/components/dashboard/ActiveAlerts";
import AirQualityIndex from "@/components/dashboard/AirQualityIndex";
import CampusMap from "@/components/dashboard/CampusMap";
import EnvironmentalMetrics, { type AggregateData } from "@/components/dashboard/EnvironmentalMetrics";
import LiveTrendChart from "@/components/dashboard/LiveTrendChart";
import MetricsHeatmap from "@/components/dashboard/MetricsHeatmap";
import NodeHealthPanel from "@/components/dashboard/NodeHealthPanel";
import NodeWatchlist from "@/components/dashboard/NodeWatchlist";
import { Card, StatusDot } from "@/components/ui";
import { IconAlert, IconChip, IconDatabase, IconSignal } from "@/components/icons";
import { useLiveNodes } from "@/hooks/useLiveNodes";
import { useRealtime } from "@/providers/realtime";
import { useNow } from "@/hooks/useNow";
import { timeAgo } from "@/lib/format";
import type { MetricKey } from "@/lib/metrics";

export default function OverviewPage() {
  const { connection, updatedAt } = useRealtime();
  const { nodes } = useLiveNodes();
  const now = useNow(1000);

  const liveNodes = nodes.filter((n) => n.live);
  // Use live nodes for aggregate, but fall back to any node with reading so dashboard never goes blank
  const displayNodes = liveNodes.length > 0 ? liveNodes : nodes.filter((n) => n.reading != null);
  const stale = liveNodes.length === 0 && displayNodes.length > 0;

  const aggregate: AggregateData = {};
  const metricKeys: MetricKey[] = [
    "temperature", "humidity", "pressure", "aqi", "tvoc",
    "eco2", "light", "rain", "sound", "uv",
  ];
  for (const key of metricKeys) {
    if (key === "rain") {
      aggregate.rain = displayNodes.some((n) => n.reading?.data?.rain === true) ? true : false;
      continue;
    }
    const vals = displayNodes
      .map((n) => n.reading?.data?.[key])
      .filter((v): v is number => typeof v === "number");
    if (vals.length > 0) {
      aggregate[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  const campusAqi = aggregate.aqi != null ? (aggregate.aqi as number) : null;

  const mapNodes = nodes.map((n) => ({
    nodeId: n.node_id,
    name: n.name,
    location: n.location,
    reading: n.reading,
    health: n.health,
    color: n.statusColor,
    label: n.statusLabel,
    live: n.live,
  }));

  const live = connection === "connected" || updatedAt != null;
  const liveColor = live ? "#059669" : "#d97706";
  const liveBg = live ? "#ecfdf5" : "#fffbeb";
  const liveBorder = live ? "#a7f3d0" : "#fde68a";

  return (
    <div className="flex flex-col gap-5">
      {/* Page header — Zoho style: white card header with breadcrumb */}
      <div className="rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold tracking-tight text-[#0f172a]">
                Environmental Overview
              </h1>
              <span
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wide"
                style={{ color: liveColor, borderColor: liveBorder, backgroundColor: liveBg }}
              >
                <StatusDot color={liveColor} pulse={live} size={7} />
                {live ? "LIVE" : "CONNECTING"}
              </span>
              <span className="hidden rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-medium text-[#64748b] ring-1 ring-[#e2e8f0] sm:inline-flex">
                {nodes.length} nodes · {liveNodes.length} online
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-[#64748b]">
              Live sensor readings and system status from campus nodes
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium text-[#94a3b8]">Last sync</p>
            <p className="text-sm font-semibold text-[#334155]">
              {updatedAt ? timeAgo(new Date(updatedAt).toISOString(), now) : "Waiting..."}
            </p>
          </div>
        </div>
      </div>

      {/* KPI strip — clean status cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Nodes Online" value={`${liveNodes.length}/${nodes.length}`} sub={`${liveNodes.length === nodes.length && nodes.length>0 ? "All nodes reporting" : stale ? "Showing last reading" : "Monitoring"}`} color="#2563eb" icon={<IconSignal size={18} />} />
        <KpiCard label="Campus AQI" value={campusAqi != null ? campusAqi.toFixed(1) : "—"} sub={campusAqi != null ? (campusAqi <=50 ? "Good" : campusAqi<=100 ? "Moderate" : "Poor") : "No data"} color="#059669" icon={<IconDatabase size={18} />} />
        <KpiCard label="Avg Temperature" value={aggregate.temperature != null ? `${(aggregate.temperature as number).toFixed(1)}°C` : "—"} sub={stale ? "Last known value" : "Campus average"} color="#d97706" icon={<IconChip size={18} />} />
        <KpiCard label="Offline Nodes" value={`${nodes.filter(n=> n.statusLabel==="OFFLINE").length}`} sub="Requires attention" color="#dc2626" icon={<IconAlert size={18} />} />
      </div>

      {/* Row 1: Campus map + right status column */}
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 lg:col-span-8">
          <Card
            title="Campus Deployment Map"
            kicker="Live sensor mesh"
            className="h-full"
            right={
              <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-semibold text-[#334155] ring-1 ring-[#e2e8f0]">
                {liveNodes.length}/{nodes.length} nodes live
              </span>
            }
          >
            <div className="relative h-[420px] lg:h-[460px]">
              <CampusMap nodes={mapNodes} />
            </div>
          </Card>
        </section>

        <section className="col-span-12 flex flex-col gap-5 lg:col-span-4">
          <Card title="Campus Air Quality" kicker={stale ? "Last known" : "Live AQI Index"} className="flex-1" dense>
            <AirQualityIndex
              aqi={campusAqi}
              nodes={displayNodes.map((n) => ({
                nodeId: n.node_id,
                name: n.name,
                aqi: typeof n.reading?.data?.aqi === "number" ? n.reading.data.aqi : null,
              }))}
            />
          </Card>
          <div className="flex-1">
            <NodeHealthPanel />
          </div>
        </section>
      </div>

      {/* Row 2: Environmental data */}
      <section>
        <EnvironmentalMetrics
          data={aggregate}
          statusText={`${stale ? "last reading from" : "averaged across"} ${displayNodes.length} node${displayNodes.length === 1 ? "" : "s"}${stale ? " · live sync paused" : ""}`}
        />
      </section>

      {/* Row 3: Trends + Active alerts — Zoho 2-column */}
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 md:col-span-7 xl:col-span-8">
          <LiveTrendChart nodes={nodes.map((n) => n.node_id)} height={300} />
        </section>
        <section className="col-span-12 md:col-span-5 xl:col-span-4">
          <ActiveAlerts limit={5} />
        </section>
      </div>

      {/* Row 4: Heatmap + Watchlist */}
      <div className="grid grid-cols-12 gap-5">
        <section className="col-span-12 md:col-span-7 xl:col-span-8">
          <MetricsHeatmap />
        </section>
        <section className="col-span-12 md:col-span-5 xl:col-span-4">
          <NodeWatchlist />
        </section>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748b]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-[#0f172a]">{value}</p>
          <p className="mt-1 text-xs font-medium text-[#94a3b8]">{sub}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundColor: color }}>
          {icon}
        </div>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
        <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: color, opacity: 0.9 }} />
      </div>
    </div>
  );
}
