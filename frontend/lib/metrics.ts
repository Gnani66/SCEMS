import type { SensorData } from "@/types/scems";

export type MetricKey =
  | "temperature"
  | "humidity"
  | "pressure"
  | "aqi"
  | "tvoc"
  | "eco2"
  | "light"
  | "rain"
  | "sound"
  | "uv";

export interface MetricMeta {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  precision: number;
  accent: string;
  /** Upper bound used to normalize "level" bars / heatmap colors */
  rangeMax: number;
}

export const METRICS: MetricMeta[] = [
  { key: "temperature", label: "Temperature", short: "TEMP", unit: "°C", precision: 2, accent: "#60A5FA", rangeMax: 45 },
  { key: "humidity", label: "Humidity", short: "HUM", unit: "%", precision: 1, accent: "#38BDF8", rangeMax: 100 },
  { key: "pressure", label: "Pressure", short: "PRESS", unit: "hPa", precision: 0, accent: "#A78BFA", rangeMax: 1050 },
  { key: "aqi", label: "AQI", short: "AQI", unit: "aqi", precision: 1, accent: "#4ADE80", rangeMax: 300 },
  { key: "tvoc", label: "TVOC", short: "TVOC", unit: "ppb", precision: 0, accent: "#FBBF24", rangeMax: 1000 },
  { key: "eco2", label: "eCO₂", short: "eCO₂", unit: "ppm", precision: 0, accent: "#34D399", rangeMax: 5000 },
  { key: "light", label: "Light", short: "LUX", unit: "lx", precision: 0, accent: "#FDE047", rangeMax: 10000 },
  { key: "rain", label: "Rain", short: "RAIN", unit: "", precision: 0, accent: "#60A5FA", rangeMax: 1 },
  { key: "sound", label: "Sound", short: "DB", unit: "dB", precision: 1, accent: "#FB923C", rangeMax: 120 },
  { key: "uv", label: "UV Index", short: "UV", unit: " ", precision: 2, accent: "#F87171", rangeMax: 11 },
];

export const METRIC_MAP = Object.fromEntries(
  METRICS.map((m) => [m.key, m]),
) as Record<MetricKey, MetricMeta>;

export function formatMetric(
  key: MetricKey,
  value: number | boolean,
): string {
  if (key === "rain") return value ? "Yes" : "No";
  const meta = METRIC_MAP[key];
  if (typeof value !== "number") return "—";
  if (Number.isNaN(value)) return "—";
  return `${value.toFixed(meta.precision)}${value < 0 ? "" : ""}`;
}

export function formatWithUnit(key: MetricKey, value: number | boolean): string {
  const meta = METRIC_MAP[key];
  if (key === "rain") return value ? "Rain" : "Dry";
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  const scalar = Math.abs(value) === 1 && key === "uv" ? "" : "";
  void scalar;
  return `${value.toFixed(meta.precision)} ${meta.unit}`.trim();
}

/* ------------------------------------------------------------------ */
/* AQI classification (US EPA style)                                   */
/* ------------------------------------------------------------------ */

export interface AqiCategory {
  label: string;
  color: string;
  description: string;
}

export const AQI_CATEGORIES: AqiCategory[] = [
  { label: "GOOD", color: "#4ADE80", description: "Air quality is satisfactory" },
  { label: "MODERATE", color: "#F5B942", description: "Acceptable; minor risk for sensitive groups" },
  { label: "SENSITIVE", color: "#FB923C", description: "Active children and adults may notice effects" },
  { label: "UNHEALTHY", color: "#EF4444", description: "Everyone may begin to experience health effects" },
  { label: "VERY UNHEALTHY", color: "#C026D3", description: "Health alert; serious effects likely" },
  { label: "HAZARDOUS", color: "#7F1D1D", description: "Emergency conditions" },
];

export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return AQI_CATEGORIES[0];
  if (aqi <= 100) return AQI_CATEGORIES[1];
  if (aqi <= 150) return AQI_CATEGORIES[2];
  if (aqi <= 200) return AQI_CATEGORIES[3];
  if (aqi <= 300) return AQI_CATEGORIES[4];
  return AQI_CATEGORIES[5];
}

export function severityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical":
      return "#EF4444";
    case "warning":
      return "#F5B942";
    case "acknowledged":
      return "#666C6C";
    default:
      return "#929797";
  }
}

/** Status text normalization for node rows / markers.
 * Thresholds tuned for 5s simulator interval + network jitter.
 * - LIVE:   age <= 60s  -> live=true  (fresh)
 * - DELAYED: 60s < age <= 120s -> live=false but not offline (transient delay)
 * - STALE:  120s < age <= 300s -> live=false
 * - OFFLINE: age > 300s or declared offline
 */
export function nodeHealthStatus(
  readingTimestamp: string | undefined,
  declaredStatus: string | undefined,
): { label: string; color: string; live: boolean } {
  const norm = (declaredStatus ?? "").toLowerCase().trim();
  const isOnline =
    norm === "online" || norm === "ok" || norm === "live" || norm === "active" || norm === "connected";
  const isOffline = norm === "offline" || norm === "disconnected" || norm === "inactive";

  if (isOffline) {
    return { label: "OFFLINE", color: "#EF4444", live: false };
  }

  if (!readingTimestamp) {
    if (isOnline) return { label: "ONLINE", color: "#4ADE80", live: true };
    return { label: "OFFLINE", color: "#EF4444", live: false };
  }

  const ts = new Date(readingTimestamp).getTime();
  if (Number.isNaN(ts)) {
    return { label: isOnline ? "ONLINE" : "OFFLINE", color: isOnline ? "#4ADE80" : "#EF4444", live: isOnline };
  }

  const ageMs = Date.now() - ts;
  // Allow clock skew: future timestamps are considered LIVE
  if (ageMs < -5000) {
    return { label: "LIVE", color: "#4ADE80", live: true };
  }
  if (ageMs > 300_000) {
    return { label: "OFFLINE", color: "#EF4444", live: false };
  }
  if (ageMs > 120_000) {
    return { label: "STALE", color: "#F5B942", live: false };
  }
  if (ageMs > 60_000) {
    return { label: "DELAYED", color: "#F59E0B", live: false };
  }
  return { label: "LIVE", color: "#4ADE80", live: true };
}

/* ------------------------------------------------------------------ */
/* History helpers                                                     */
/* ------------------------------------------------------------------ */

export function metricSeries(
  readings: Array<Record<string, unknown>>,
  key: string,
): { time: number; value: number | null }[] {
  return readings
    .map((r) => ({
      time: new Date(r["timestamp"] as string).getTime(),
      value: asNumber(r[key]),
    }))
    .filter((p) => !Number.isNaN(p.time));
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function seriesStats(
  values: Array<number | null>,
): { min: number; max: number; avg: number } | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return { min, max, avg };
}

/* ------------------------------------------------------------------ */
/* SensorData accessor (tolerant of unknown shapes)                    */
/* ------------------------------------------------------------------ */

export function readDataValue(data: SensorData | undefined, key: MetricKey): number | boolean | null {
  if (!data) return null;
  const value = data[key];
  return value === undefined ? null : value;
}