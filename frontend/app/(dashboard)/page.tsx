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

  // Campus aggregate: average of actual node readings (rain = any).
  const aggregate: AggregateData = {};
  const metricKeys: MetricKey[] = [
    "temperature", "humidity", "pressure", "aqi", "tvoc",
    "eco2", "light", "rain", "sound", "uv",
  ];
  for (const key of metricKeys) {
    if (key === "rain") {
      aggregate.rain = liveNodes.some((n) => n.reading?.data?.rain === true) ? true : false;
      continue;
    }
    const vals = liveNodes
      .map((n) => n.reading?.data?.[key])
      .filter((v): v is number => typeof v === "number");
    if (vals.length > 0) {
      aggregate[key] = vals.reduce((a, b) => a + b, 0) / vals.length;
    }
  }

  const campusAqi =
    aggregate.aqi != null
      ? (aggregate.aqi as number)
      : null;

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
  const liveColor = live ? "#4ADE80" : "#F5B942";

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-ink">
              Environmental Overview
            </h1>
            <span className="flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ color: liveColor, borderColor: `${liveColor}44`, backgroundColor: `${liveColor}12` }}>
              <StatusDot color={liveColor} pulse={live} size={6} />
              LIVE
            </span>
          </div>
          <p className="mt-1 text-[12px] text-muted">
            Real-time campus environmental intelligence
          </p>
        </div>
        <div className="text-right text-[11px] text-muted">
          {updatedAt ? (
            <>
              Updated <span className="text-secondary">{timeAgo(new Date(updatedAt).toISOString(), now)}</span>
            </>
          ) : (
            "Waiting for sensor data…"
          )}
        </div>
      </div>

      {/* Row 1: Campus map + right status column */}
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 lg:col-span-8">
          <Card
            title="Campus Map"
            kicker="Live deployment"
            className="h-full"
            right={
              <span className="text-[11px] text-muted">
                {liveNodes.length}/{nodes.length} nodes online
              </span>
            }
            dense
          >
            <div className="relative h-[400px] lg:h-[446px]">
              <CampusMap nodes={mapNodes} />
            </div>
          </Card>
        </section>

        <section className="col-span-12 flex flex-col gap-4 lg:col-span-4">
          <Card title="Campus Air Quality" kicker="Live AQI index" className="flex-1" dense>
            <AirQualityIndex
              aqi={campusAqi}
              nodes={liveNodes.map((n) => ({
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
          statusText={`based on ${liveNodes.length} live node${liveNodes.length === 1 ? "" : "s"}`}
        />
      </section>

      {/* Row 3: Trends + Active alerts */}
      <div className="grid grid-cols-12 gap-4">
        <section className="col-span-12 md:col-span-7 xl:col-span-8">
          <LiveTrendChart nodes={nodes.map((n) => n.node_id)} height={300} />
        </section>
        <section className="col-span-12 md:col-span-5 xl:col-span-4">
          <ActiveAlerts limit={5} />
        </section>
      </div>

      {/* Row 4: Heatmap + Watchlist */}
      <div className="grid grid-cols-12 gap-4">
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