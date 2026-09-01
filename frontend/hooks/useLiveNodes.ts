"use client";

import { useEffect, useMemo } from "react";
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

  // Keep roster fresh — poll every 15s so new nodes and backend restarts recover
  useEffect(() => {
    const id = setInterval(() => reload(), 15000);
    return () => clearInterval(id);
  }, [reload]);

  // If WebSocket is disconnected for a while, still try to refresh roster sooner
  useEffect(() => {
    if (realtime.connection === "reconnecting" || realtime.connection === "disconnected") {
      const id = setTimeout(() => reload(), 5000);
      return () => clearTimeout(id);
    }
  }, [realtime.connection, reload]);

  const nodes = useMemo<LiveNode[]>(() => {
    const roster = data?.nodes ?? [];

    // Union of roster nodes + any nodes seen via WebSocket / fallback polling
    // Ensures frontend never goes blank even if /api/nodes transiently fails
    const allNodeIds = new Set<string>([
      ...roster.map((n) => n.node_id),
      ...Object.keys(realtime.readings),
      ...Object.keys(realtime.health),
      ...Object.keys(realtime.status),
    ]);

    const rosterById = new Map(roster.map((n) => [n.node_id, n]));

    const liveReadings = enrichReadings(
      realtime.readings,
      roster.map((n) => ({ node_id: n.node_id, latest_reading: n.latest_reading })),
    );

    // For nodes only seen via WS (not in roster yet), readings already in liveReadings
    // For roster-only nodes without WS reading, liveReadings already contains DB latest_reading via enrichReadings
    const result: LiveNode[] = [];
    for (const nodeId of allNodeIds) {
      const info = rosterById.get(nodeId);
      const reading = liveReadings[nodeId] ?? realtime.readings[nodeId] ?? info?.latest_reading ?? null;
      const health = realtime.health[nodeId] ?? info?.health ?? null;
      const declared = info?.status || realtime.status[nodeId]?.status || (reading ? "online" : "unknown");
      const status = nodeHealthStatus(reading?.timestamp, declared);

      result.push({
        node_id: nodeId,
        name: reading?.node_name ?? nodeId,
        location: reading?.location ?? "Unknown",
        reading,
        health,
        declaredStatus: declared,
        live: status.live,
        statusLabel: status.label,
        statusColor: status.color,
      });
    }

    // If still empty (no roster and no WS yet), fall back to roster-only mapping
    if (result.length === 0 && roster.length > 0) {
      return roster
        .map((info) => {
          const reading = liveReadings[info.node_id] ?? null;
          const health = realtime.health[info.node_id] ?? info.health ?? null;
          const declared = info.status || realtime.status[info.node_id]?.status || "unknown";
          const status = nodeHealthStatus(reading?.timestamp, declared);
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
    }

    return result.sort((a, b) => a.node_id.localeCompare(b.node_id));
  }, [data, realtime.readings, realtime.health, realtime.status]);

  return { nodes, loading, error, reload };
}