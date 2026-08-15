"use client";

import { useMemo } from "react";
import { getNodes } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useRealtime } from "@/providers/realtime";
import { enrichReadings } from "@/lib/normalize";
import { nodeHealthStatus } from "@/lib/metrics";
import type { NodeHealth, SensorReading } from "@/types/scems";

export interface LiveNode {
  node_id: string;
  name: string;
  location: string;
  reading: SensorReading | null;
  health: NodeHealth | null;
  declaredStatus: string;
  live: boolean;
  statusLabel: string;
  statusColor: string;
}

/**
 * Source of truth for node state:
 * - /api/nodes supplies node roster, declared status and telemetry
 * - the realtime store supplies the freshest live reading
 */
export function useLiveNodes() {
  const { data, loading, error, reload } = useApi(() => getNodes(), []);
  const realtime = useRealtime();

  const nodes = useMemo<LiveNode[]>(() => {
    const roster = data?.nodes ?? [];
    const liveReadings = enrichReadings(
      realtime.readings,
      roster.map((n) => ({ node_id: n.node_id, latest_reading: n.latest_reading })),
    );

    return roster
      .map((info) => {
        const reading = liveReadings[info.node_id] ?? null;
        const health = realtime.health[info.node_id] ?? info.health ?? null;
        const declared = info.status || realtime.status[info.node_id]?.status || "unknown";
        const status = nodeHealthStatus(
          reading?.timestamp,
          declared.toLowerCase(),
        );

        return {
          node_id: info.node_id,
          name: reading?.node_name ?? info.node_id,
          location: reading?.location ?? "Unknown",
          reading,
          health,
          declaredStatus: declared,
          live: status.live,
          statusLabel: status.label,
          statusColor: status.color,
        };
      })
      .sort((a, b) => a.node_id.localeCompare(b.node_id));
  }, [data, realtime.readings, realtime.health, realtime.status]);

  return { nodes, loading, error, reload };
}