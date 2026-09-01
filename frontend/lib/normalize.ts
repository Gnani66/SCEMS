import type {
  FlatReading,
  SensorData,
  SensorReading,
} from "@/types/scems";

/** Convert a flat DB row into the canonical SensorReading shape. */
export function flatToReading(flat: FlatReading): SensorReading {
  return {
    node_id: flat.node_id,
    node_name: flat.node_id,
    location: "",
    timestamp: flat.timestamp,
    data: {
      temperature: flat.temperature,
      humidity: flat.humidity,
      pressure: flat.pressure,
      aqi: flat.aqi,
      tvoc: flat.tvoc,
      eco2: flat.eco2,
      light: flat.light,
      rain: flat.rain,
      sound: flat.sound,
      uv: flat.uv,
    },
  };
}

/** Build a Record<node_id, SensorReading> from flat latest rows. */
export function readingsFromFlat(
  rows: FlatReading[],
): Record<string, SensorReading> {
  const map: Record<string, SensorReading> = {};
  for (const row of rows) {
    map[row.node_id] = flatToReading(row);
  }
  return map;
}

/**
 * Merge metadata (name/location) from /api/nodes into reading records.
 * Prefers fresh WebSocket readings; never overwrites a newer timestamp
 * with a stale DB timestamp.
 */
export function enrichReadings(
  readings: Record<string, SensorReading>,
  nodesInfo: Array<{ node_id: string; latest_reading: SensorReading | null }>,
): Record<string, SensorReading> {
  const merged = { ...readings };

  for (const info of nodesInfo) {
    const nodeId = info.node_id;
    const live = info.latest_reading;
    if (!merged[nodeId]) {
      if (live) {
        merged[nodeId] = live;
      }
      continue;
    }
    // Only fill missing metadata — never overwrite fresh timestamp
    if (live?.location && !merged[nodeId].location) {
      merged[nodeId] = { ...merged[nodeId], location: live.location };
    }
    if (live?.node_name && (!merged[nodeId].node_name || merged[nodeId].node_name === merged[nodeId].node_id)) {
      merged[nodeId] = { ...merged[nodeId], node_name: live.node_name };
    }
    // Only use DB timestamp if we have no timestamp or DB is newer
    if (live?.timestamp && !merged[nodeId].timestamp) {
      merged[nodeId] = { ...merged[nodeId], timestamp: live.timestamp };
    } else if (live?.timestamp && merged[nodeId].timestamp) {
      const wsTime = new Date(merged[nodeId].timestamp).getTime();
      const dbTime = new Date(live.timestamp).getTime();
      if (!Number.isNaN(dbTime) && dbTime > wsTime) {
        merged[nodeId] = { ...merged[nodeId], timestamp: live.timestamp };
      }
    }
  }

  return merged;
}

/** Collect sensor values into a flat data object (best-effort). */
export function dataOf(reading: SensorReading | undefined): SensorData | null {
  if (!reading) return null;
  return reading.data ?? null;
}